export class ErroDominio extends Error { constructor(message: string, readonly status = 400) { super(message); this.name = 'ErroDominio'; } }
export class ErroIntegracao extends Error { constructor(message: string) { super(message); this.name = 'ErroIntegracao'; } }
export class ErroIA extends Error { constructor(message: string, readonly status?: number) { super(message); this.name = 'ErroIA'; } }
