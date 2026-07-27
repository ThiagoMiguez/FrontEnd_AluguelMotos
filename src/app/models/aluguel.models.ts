export interface Moto {
  id: number;
  descricao: string;
}

export interface Reserva {
  id: number;
  motoId: number;
  status: string;
}
