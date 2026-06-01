// Enums compartidos por server actions + pages
export const ETAPAS_LEAD = ['nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado', 'perdido'] as const;
export type EtapaLead = (typeof ETAPAS_LEAD)[number];

export const ESTADOS_IDEA = ['idea', 'produccion', 'aprobado', 'posteado'] as const;
export type EstadoIdea = (typeof ESTADOS_IDEA)[number];

export const FORMATOS_IDEA = ['carrusel', 'post', 'story', 'reel'] as const;
export type FormatoIdea = (typeof FORMATOS_IDEA)[number];

export const ESTADOS_CLIENTE = ['activo', 'pausado', 'cerrado'] as const;
export const PRIORIDADES = ['alta', 'media', 'baja'] as const;
