# Sales Navigator — automatización de búsqueda B2B (FERVOR)

Herramientas para armar la búsqueda de **Búsqueda de posibles clientes** de Sales
Navigator que alimenta el outreach (ver la página in-app `/outreach`). Aplican los
filtros por automatización; **los invites se mandan a mano** (LinkedIn anti-bot).

## ICP (2026-06-25)

Dueños de negocios que **viven en LinkedIn y necesitan CRM / automatización de
procesos**. Se les ofrece un **diagnóstico de optimización + automatización**
(ahorrarles tiempo, plata y dolores de cabeza) = el caso FMA replicado.

**NO** rubros de consumo local (veterinarias, belleza, gastronomía, autos, retail):
no están en LinkedIn. LinkedIn = B2B / profesional / financiero.

## Receta de filtros (la que aplican los scripts)

| Filtro | Valor |
|---|---|
| **Nivel de responsabilidad** | `Propietario/socio` (el dueño que siente el dolor y decide) |
| **Empleados en la empresa** | `Autónomo` · `1-10` · `11-50` · `51-200` |
| **Ubicación** | Argentina · México · Chile · Uruguay · Colombia · Perú · España |
| **Industria (9, nombres EXACTOS de la taxonomía SN)** | `Bienes inmuebles` · `Formación profesional y coaching` · `Gestión de inversiones` · `Asesoría de inversión` · `Servicios financieros` · `Agencias de seguros y corretaje` · `Consultoría y servicios a empresas` · `Servicios de marketing` · `Servicios de publicidad` |

Da ~130 mil+ resultados. El "tiene atención al cliente / procesos" se da por
**Industria** (NO por Función=atención-al-cliente: eso pesca empleados in-house).

Otras taxonomías útiles sondeadas: `Banca de inversión`, `Seguros`, `Fideicomisos
y patrimonio`, `Servicios y consultoría de TI`, `Desarrollo de software`.

## Cómo correr

Requiere Chrome con depuración remota en `:9222` y sesión de Sales Navigator
logueada del user, y `playwright-core` (está en `pgscratch/node_modules`).

```bash
# 1. Chrome debug vivo + tab de SN abierto y logueado:
#    curl -X PUT "http://localhost:9222/json/new?https://www.linkedin.com/sales/search/people"
# 2. Aplicar industrias + ubicación + nivel + empleados:
node sn_b2b_final.mjs
# (si corta por timeout antes de Nivel/Empleados:)
node sn_finish.mjs
```

## Gotchas (aprendidos 2026-06-24/25)

- **Typeahead Ember:** `fill()` NO filtra la lista (no dispara el evento) → usar
  keystrokes reales (`pressSequentially`). Limpiar con Ctrl+A + Delete antes.
- **Incluir opción:** cada fila es `"<Label> Incluir Excluir"`. El regex DEBE anclar
  el inicio `^\s*<label>\s+Incluir` — si no, "México" matchea el 2º "México" de
  "México, México" (estado) en vez del país.
- **Nivel ya incluido** = chip verde "Propietario/socio | X", sale de la lista
  "Incluir" → la función da `false` falso-negativo; verificar por chip/URL.
- **connectOverCDP cuelga** si hay muchos tabs pesados (Easypanel, FMA) o si Chrome
  se reinició: cerrar todos los tabs menos el de SN (`curl /json/close/<id>`).
- **Importar contactos:** la `Connections.csv` viene dentro del ZIP del export de
  datos de LinkedIn (aunque la página de descarga no la liste). Subir en
  `/crm/importar` (server action `importLinkedinCsv`, dedup por email+nombre).
  La `/api/leads/create` NO sirve para esto (exige contacto/email; LinkedIn casi
  nunca trae email).

Memoria relacionada: `reference_sn_filters_automation`, `project_fervor_linkedin_outreach`.
