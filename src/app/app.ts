import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { AluguelApiService } from './services/aluguel-api.service';
import { Moto, Reserva } from './models/aluguel.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly api = inject(AluguelApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private cronometroId: ReturnType<typeof setInterval> | null = null;

  motosDisponiveis: Moto[] = [];
  reservas: Reserva[] = [];
  carregandoMotos = false;
  carregandoReservas = false;
  carregandoReservasCache = false;
  reservandoMotoId: number | null = null;
  processandoReservasEmLote = false;
  tipoProcessamentoEmLote: 'reservar' | 'excluir' | null = null;
  erroMotos = '';
  
  erroMotosCache = '';
  motosDisponiveisCache: Moto[] = [];
  carregandoMotosCache = false;

  erroReservas = '';
  erroReservasCache = '';
  reservasCache: Reserva[] = [];
  tempoRestante = 5;

  ngOnInit(): void {
    this.iniciarCronometro();
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.pararCronometro();
  }

  carregarDados(): void {
    this.carregarMotos();
    this.carregarMotosCache();
    this.carregarReservas();
    this.carregarReservasCache();
  }

  reiniciarCronometro(): void {
    this.iniciarCronometro();
  }

  solicitarTodasReservas(): void {
    if (this.estaProcessandoReservas() || this.motosDisponiveis.length === 0) {
      return;
    }

    this.processandoReservasEmLote = true;
    this.tipoProcessamentoEmLote = 'reservar';
    this.erroReservas = '';

    forkJoin(this.motosDisponiveis.map((moto) => this.api.criarReserva(moto.id)))
      .pipe(
        finalize(() => {
          this.processandoReservasEmLote = false;
          this.tipoProcessamentoEmLote = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.carregarDados();
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroReservas = this.extrairMensagemErro(erro, 'Nao foi possivel solicitar todas as reservas.');
          this.cdr.detectChanges();
        },
      });

    this.reiniciarCronometro();
  }

  reservarMoto(motoId: number): void {
      if (this.estaProcessandoReservas()) {
        return;
      }

      this.reservandoMotoId = motoId;
      this.api
        .criarReserva(motoId)
        .pipe(
          finalize(() => {
            this.reservandoMotoId = null;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: () => {
            this.carregarDados();
            this.cdr.detectChanges();
          },
          error: (erro: HttpErrorResponse) => {
            this.erroReservas = this.extrairMensagemErro(erro, 'Nao foi possivel criar a reserva.');
            this.cdr.detectChanges();
          },
        });
        
        this.reiniciarCronometro();
  }

  excluirReserva(reservaId: number): void {
    if (this.estaProcessandoReservas()) {
      return;
    }

    this.reservandoMotoId = reservaId;
    this.api
      .excluirReserva(reservaId)
      .pipe(
        finalize(() => {
          this.reservandoMotoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.carregarDados();
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroReservas = this.extrairMensagemErro(erro, 'Nao foi possivel excluir a reserva.');
          this.cdr.detectChanges();
        },
      });
      this.reiniciarCronometro();
  }

  excluirTodasReservas(): void {
    if (this.estaProcessandoReservas() || this.reservas.length === 0) {
      return;
    }

    this.processandoReservasEmLote = true;
    this.tipoProcessamentoEmLote = 'excluir';
    this.erroReservas = '';

    forkJoin(this.reservas.map((reserva) => this.api.excluirReserva(reserva.id)))
      .pipe(
        finalize(() => {
          this.processandoReservasEmLote = false;
          this.tipoProcessamentoEmLote = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.carregarDados();
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroReservas = this.extrairMensagemErro(erro, 'Nao foi possivel excluir todas as reservas.');
          this.cdr.detectChanges();
        },
      });

    this.reiniciarCronometro();
  }

  private carregarMotos(): void {
    this.carregandoMotos = true;
    this.erroMotos = '';
    this.api
      .getDisponiveis()
      .pipe(
        finalize(() => {
          this.carregandoMotos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (motos) => {
          this.motosDisponiveis = motos ?? [];
          this.carregandoMotos = false;
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroMotos = this.extrairMensagemErro(erro, 'Nao foi possivel carregar as motos disponiveis.');
          this.carregandoMotos = false;
          this.motosDisponiveis = [];
          this.cdr.detectChanges();
        },
      });
  }

  private carregarMotosCache(): void {
    this.carregandoMotosCache = true;
    this.erroMotosCache = '';
    this.api
      .getDisponiveisCache()
      .pipe(
        finalize(() => {
          this.carregandoMotosCache = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (motos) => {
          this.motosDisponiveisCache = motos ?? [];
          this.carregandoMotosCache = false;
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroMotosCache = this.extrairMensagemErro(erro, 'Nao foi possivel carregar as motos disponiveis.');
          this.carregandoMotosCache = false;
          this.motosDisponiveisCache = [];
          this.cdr.detectChanges();
        },
      });
  }  


  private carregarReservas(): void {
    this.carregandoReservas = true;
    this.erroReservas = '';
    this.api
      .consultarReservas()
      .pipe(
        finalize(() => {
          this.carregandoReservas = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (reservas) => {
          this.reservas = reservas ?? [];
          this.carregandoReservas = false;
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroReservas = this.extrairMensagemErro(erro, 'Nao foi possivel carregar as reservas.');
          this.carregandoReservas = false;
          this.reservas = [];
          this.cdr.detectChanges();
        },
      });
  }

  private carregarReservasCache(): void {
    this.carregandoReservasCache = true;
    this.erroReservasCache = '';
    this.api
      .consultarReservasCache()
      .pipe(
        finalize(() => {
          this.carregandoReservasCache = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (reservas) => {
          this.reservasCache = reservas ?? [];
          this.carregandoReservasCache = false;
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.erroReservasCache = this.extrairMensagemErro(erro, 'Nao foi possivel carregar as reservas.');
          this.carregandoReservasCache = false;
          this.reservasCache = [];
          this.cdr.detectChanges();
        },
      });
  }  

  private iniciarCronometro(): void {
    this.pararCronometro();
    this.tempoRestante = 5;
    this.cdr.detectChanges();

    this.cronometroId = setInterval(() => {
      if (this.tempoRestante > 0) {
        this.tempoRestante -= 1;
      }

      if (this.tempoRestante === 0) {
        this.pararCronometro();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private pararCronometro(): void {
    if (this.cronometroId !== null) {
      clearInterval(this.cronometroId);
      this.cronometroId = null;
    }
  }

  private estaProcessandoReservas(): boolean {
    return this.reservandoMotoId !== null || this.processandoReservasEmLote;
  }

  private extrairMensagemErro(erro: HttpErrorResponse, fallback: string): string {
    if (typeof erro.error === 'string' && erro.error.trim().length > 0) {
      return erro.error;
    }

    if (erro.error?.message && typeof erro.error.message === 'string') {
      return erro.error.message;
    }

    return fallback;
  }
}
