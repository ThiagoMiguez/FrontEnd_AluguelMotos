import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Moto, Reserva } from '../models/aluguel.models';

@Injectable({
  providedIn: 'root',
})
export class AluguelApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'https://localhost:8080/api';

getDisponiveisCache(): Observable<Moto[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/Motos/redis `)
      .pipe(map((resposta) => this.extrairLista(resposta) as Moto[]));
  }

  getDisponiveis(): Observable<Moto[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/Motos`)
      .pipe(map((resposta) => this.extrairLista(resposta) as Moto[]));
  }

  criarReserva(motoId: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.apiBaseUrl}/Reservas/${motoId}`, {});
  }

  excluirReserva(reservaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/Reservas/${reservaId}`);
  }

  consultarReservasCache(): Observable<Reserva[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/Reservas/redis`)
      .pipe(map((resposta) => this.extrairLista(resposta) as Reserva[]));
  }

  consultarReservas(): Observable<Reserva[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/Reservas`)
      .pipe(map((resposta) => this.extrairLista(resposta) as Reserva[]));
  }

  private extrairLista(resposta: unknown): unknown[] {
    if (Array.isArray(resposta)) {
      return resposta;
    }

    if (!resposta || typeof resposta !== 'object') {
      return [];
    }

    const objeto = resposta as Record<string, unknown>;

    if (Array.isArray(objeto['data'])) {
      return objeto['data'];
    }

    if (Array.isArray(objeto['items'])) {
      return objeto['items'];
    }

    if (Array.isArray(objeto['value'])) {
      return objeto['value'];
    }

    if (Array.isArray(objeto['$values'])) {
      return objeto['$values'];
    }

    return [];
  }
}
