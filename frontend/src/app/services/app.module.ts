// src/app/app.module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ListaSetoresComponent } from './components/lista-setores/lista-setores.component';
import { CriarSetorComponent }  from './components/criar-setor/criar-setor.component';
import { ListaAuditoriasComponent } from './components/lista-auditorias/lista-auditorias.component';
// importe aqui seus demais componentes...

const routes: Routes = [
    { path: '', redirectTo: '/setores', pathMatch: 'full' },
    { path: 'setores',      component: ListaSetoresComponent },
    { path: 'setores/novo', component: CriarSetorComponent },
    { path: 'auditorias',   component: ListaAuditoriasComponent },
    // adicione outras rotas conforme seus componentes/funcionalidades
];

@NgModule({
    declarations: [
        AppComponent,
        ListaSetoresComponent,
        CriarSetorComponent,
        ListaAuditoriasComponent,
        // liste aqui todos os seus componentes
    ],
    imports: [
        BrowserModule,
        HttpClientModule,         // permite usar HttpClient
        FormsModule,              // para template-driven forms
        ReactiveFormsModule,      // para reactive forms
        RouterModule.forRoot(routes)  // registra as rotas
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
