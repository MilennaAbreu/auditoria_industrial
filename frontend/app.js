(function() {
    angular.module('auditoriaApp', [])
        .constant('API', 'https://controle-industrial-api.onrender.com/api')
        .controller('HomeController', ['$http', '$timeout', 'API', function($http, $timeout, API) {
            const vm = this;

            vm.authenticated = false;
            vm.password      = '';
            vm.loginError    = false;

            vm.login = function() {
                if (vm.password === 'Frigoias@2025#') {
                    vm.authenticated = true;
                    vm.loginError    = false;
                } else {
                    vm.loginError = true;
                }
            };

            vm.step = 0;
            vm.auditorias = [];
            vm.setores = [];
            vm.ratingOptions = [
                { label: 'Excelente', value: 5 },
                { label: 'Bom',       value: 4 },
                { label: 'Regular',   value: 3 },
                { label: 'Ruim',      value: 2 },
                { label: 'Péssimo',   value: 1 }
            ];

            const hoje = new Date();
            vm.endDate = hoje;
            vm.startDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7);

            vm.form = {
                nome_gestor:       '',
                setor_id:          '',
                data_auditoria:    null,
                checklist:         [],
                conformidades:     [],
                acoes_corretivas:  [],
                observacoes_gerais:''
            };

            vm.previousConfs = [];
            vm.confsEmAtraso = [];
            vm.confsEmAberto = [];

            vm.editingId = null;

            let pendentesChartInstance = null;
            let notaChartInstance      = null;

            vm.load = function() {
                const qs = [];
                if (vm.startDate) qs.push('start=' + vm.startDate.toISOString().split('T')[0]);
                if (vm.endDate)   qs.push('end='   + vm.endDate.toISOString().split('T')[0]);
                const url = API + '/auditorias' + (qs.length ? '?' + qs.join('&') : '');

                $http.get(url)
                    .then(r => {
                        vm.auditorias = r.data || [];
                        $timeout(vm.renderDashboards, 50);
                    })
                    .catch(err => {
                        console.error('Erro ao buscar auditorias:', err);
                        vm.auditorias = [];
                        vm.clearCharts();
                    });
            };

            vm.delete = function(aud) {
                if (!confirm('Deseja realmente excluir esta auditoria?')) return;
                $http.delete(`${API}/auditorias/${aud.id}`)
                    .then(() => vm.load())
                    .catch(err => alert('Erro ao excluir: ' + err.statusText));
            };

            vm.openPDF = function(aud) {
                const url = 'pdf.html?id=' + aud.id;
                window.open(url, '_blank');
            };

            vm.edit = function(aud) {
                vm.editingId = aud.id;
                vm.form.nome_gestor       = aud.nome_gestor;
                vm.form.setor_id          = aud.setor_id;
                const apenasDate = aud.data_auditoria.split('T')[0];
                vm.form.data_auditoria = new Date(apenasDate);
                vm.form.observacoes_gerais = aud.observacoes || '';

                $http.get(API + '/checklist-items').then(r => {
                    const items = r.data.map(i => ({
                        id: i.id,
                        categoria: i.categoria,
                        descricao: i.descricao,
                        __rating: null,
                        __observacao: ''
                    }));

                    $http.get(`${API}/auditorias/${aud.id}/responses`)
                        .then(respRes => {
                            const respData = respRes.data;
                            items.forEach(it => {
                                const found = respData.find(rr => rr.item_descricao === it.descricao);
                                if (found) {
                                    it.__rating = found.rating;
                                    it.__observacao = found.observacao;
                                }
                            });
                            vm.form.checklist = items;
                        })
                        .catch(() => {
                            vm.form.checklist = items;
                        });
                });

                vm.step = 1;
            };

            vm.new = function() {
                vm.editingId = null;
                vm.form = {
                    nome_gestor:       '',
                    setor_id:          '',
                    data_auditoria:    new Date(),
                    checklist:         [],
                    conformidades:     [],
                    acoes_corretivas:  [],
                    observacoes_gerais:''
                };
                $http.get(API + '/setores').then(r => vm.setores = r.data);
                $http.get(API + '/checklist-items').then(r => {
                    vm.form.checklist = r.data.map(i => ({
                        id: i.id,
                        categoria: i.categoria,
                        descricao: i.descricao,
                        __rating: null,
                        __observacao: ''
                    }));
                });
                vm.step = 1;
            };

            vm.cancel = function() {
                vm.step = 0;
                vm.editingId = null;
            };

            vm.nextStep = function() {
                const allSelected = vm.form.checklist.every(i => i.__rating !== null);
                if (!allSelected) {
                    alert('Selecione rating em todos os itens do checklist.');
                    return;
                }
                vm.form.conformidades    = [{ descricao: '', prazo_correcao: null, setor_id: vm.form.setor_id }];
                vm.form.acoes_corretivas = [{ descricao: '' }];

                vm.loadPreviousConfs();
                vm.step = 2;
            };

            vm.loadPreviousConfs = function() {
                const setor_id = vm.form.setor_id;
                if (!setor_id) {
                    vm.previousConfs  = [];
                    vm.confsEmAtraso  = [];
                    vm.confsEmAberto  = [];
                    return;
                }

                $http.get(`${API}/conformidades/setor/${setor_id}`)
                    .then(r => {
                        vm.previousConfs = (r.data || []).filter(c => c.resolvido === false);
                        const d  = vm.form.data_auditoria;
                        const yyyy = d.getFullYear();
                        const mm   = String(d.getMonth() + 1).padStart(2, '0');
                        const dd   = String(d.getDate()).padStart(2, '0');
                        const dataAudStr = `${yyyy}-${mm}-${dd}`;

                        vm.confsEmAtraso = vm.previousConfs.filter(c => c.prazo_correcao < dataAudStr);
                        vm.confsEmAberto = vm.previousConfs.filter(c => c.prazo_correcao >= dataAudStr);
                    })
                    .catch(err => {
                        console.error('Erro ao carregar conformidades:', err);
                        vm.previousConfs  = [];
                        vm.confsEmAtraso  = [];
                        vm.confsEmAberto  = [];
                    });
            };

            vm.toggleResolve = function(c) {
                $http.patch(`${API}/conformidades/${c.id}`, { resolvido: c.resolvido })
                    .then(() => {
                        if (c.resolvido) {
                            vm.loadPreviousConfs();
                        }
                    })
                    .catch(err => {
                        alert('Não foi possível atualizar: ' + err.statusText);
                        c.resolvido = false;
                    });
            };

            vm.addConformidade = function() {
                vm.form.conformidades.push({ descricao: '', prazo_correcao: null, setor_id: vm.form.setor_id });
            };
            vm.removeConformidade = function(idx) {
                vm.form.conformidades.splice(idx, 1);
            };

            vm.addAcao = function() {
                vm.form.acoes_corretivas.push({ descricao: '' });
            };
            vm.removeAcao = function(idx) {
                vm.form.acoes_corretivas.splice(idx, 1);
            };

            vm.prevStep = function() {
                vm.step = 1;
            };

            vm.save = function() {
                for (const c of vm.form.conformidades) {
                    if (!c.descricao || !c.prazo_correcao) {
                        alert('Preencha todas as conformidades e prazos corretamente.');
                        return;
                    }
                }
                for (const a of vm.form.acoes_corretivas) {
                    if (!a.descricao) {
                        alert('Preencha todas as ações corretivas.');
                        return;
                    }
                }

                const payload = {
                    nome_gestor:       vm.form.nome_gestor,
                    setor_id:          vm.form.setor_id,
                    data_auditoria:    vm.form.data_auditoria.toISOString().split('T')[0],
                    responses:         vm.form.checklist.map(i => ({
                        checklist_item_id: i.id,
                        rating: i.__rating,
                        observacao: i.__observacao
                    })),
                    conformidades:     vm.form.conformidades.map(c => ({
                        descricao: c.descricao,
                        prazo_correcao: c.prazo_correcao.toISOString().split('T')[0]
                    })),
                    acoes_corretivas:  vm.form.acoes_corretivas.map(a => ({
                        descricao: a.descricao
                    })),
                    observacoes_gerais: vm.form.observacoes_gerais
                };

                $http.post(`${API}/auditorias`, payload)
                    .then(() => {
                        vm.step = 0;
                        vm.load();
                    })
                    .catch(err => alert('Erro ao salvar: ' + (err.data?.error || err.statusText)));
            };

            vm.renderDashboards = function() {
                vm.clearCharts();
                const labelsPendentes = [];
                const dataPendentes   = [];

                if (!vm.setores || vm.setores.length === 0) {
                    $http.get(API + '/setores').then(r => {
                        vm.setores = r.data;
                        $timeout(vm.renderDashboards, 50);
                    });
                    return;
                }

                const fetchPendentesPorSetor = async () => {
                    for (const setor of vm.setores) {
                        try {
                            const resp = await $http.get(`${API}/conformidades/setor/${setor.id}`);
                            const lista = resp.data || [];
                            labelsPendentes.push(setor.nome);
                            dataPendentes.push(lista.length);
                        } catch (e) {
                            labelsPendentes.push(setor.nome);
                            dataPendentes.push(0);
                        }
                    }
                    const ctx1 = document.getElementById('pendentesChart').getContext('2d');
                    pendentesChartInstance = new Chart(ctx1, {
                        type: 'bar',
                        data: {
                            labels: labelsPendentes,
                            datasets: [{
                                label: 'Pendentes',
                                data: dataPendentes,
                                backgroundColor: 'rgba(230, 65, 20, 0.6)',
                                borderColor:   'rgba(230, 65, 20, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { stepSize: 1 }
                                }
                            },
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });
                };
                fetchPendentesPorSetor();

                const agrup = {};
                vm.auditorias.forEach(aud => {
                    const nomeSetor = aud.setor_nome;
                    if (!agrup[nomeSetor]) agrup[nomeSetor] = [];
                    agrup[nomeSetor].push(aud.nota);
                });
                const labelsNota = [];
                const dataNota   = [];
                Object.keys(agrup).forEach(nomeSetor => {
                    const notas = agrup[nomeSetor];
                    const soma   = notas.reduce((s, v) => s + v, 0);
                    const media  = soma / notas.length;
                    const perc   = Math.round((media / 5) * 100);
                    labelsNota.push(nomeSetor);
                    dataNota.push(perc);
                });

                $timeout(() => {
                    const ctx2 = document.getElementById('notaChart').getContext('2d');
                    notaChartInstance = new Chart(ctx2, {
                        type: 'line',
                        data: {
                            labels: labelsNota,
                            datasets: [{
                                label: '% Média',
                                data: dataNota,
                                fill: false,
                                borderColor: 'rgba(0, 123, 255, 1)',
                                backgroundColor: 'rgba(0, 123, 255, 0.4)',
                                tension: 0.2
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100
                                }
                            }
                        }
                    });
                }, 100);
            };

            vm.clearCharts = function() {
                if (pendentesChartInstance) {
                    pendentesChartInstance.destroy();
                    pendentesChartInstance = null;
                }
                if (notaChartInstance) {
                    notaChartInstance.destroy();
                    notaChartInstance = null;
                }
            };

            $http.get(API + '/setores').then(r => vm.setores = r.data);
            vm.load();
        }]);
})();
