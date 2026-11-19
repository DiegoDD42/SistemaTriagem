// Motor de regras da triagem: avalia as regras de regras.js e explica a decisão.
import REGRAS from '../data/regras.js';

const SINAIS = ['fc', 'fr', 'spo2', 'pas', 'temp', 'glasgow', 'dor'];

// Resolve o valor de uma regra: número fixo ou tabela por idade ({ porIdadeMeses, senao }).
function resolver(valor, p) {
  if (valor && typeof valor === 'object' && valor.porIdadeMeses) {
    if (p.idade === undefined || p.idade === null) return undefined; // sem idade, não dá para aplicar
    const meses = p.idade * 12;
    const faixa = valor.porIdadeMeses.find(([ate]) => meses < ate);
    return faixa ? faixa[1] : valor.senao;
  }
  return valor;
}

export function avaliar(c, p) {
  if (Array.isArray(c)) {
    const [campo, op, bruto] = c;
    const v = p[campo];
    if (v === undefined || v === null) return false; // dado ausente nunca dispara a regra
    const valor = resolver(bruto, p);
    if (valor === undefined) return false;
    switch (op) {
      case '==': return v === valor;
      case '!=': return v !== valor;
      case '>': return v > valor;
      case '>=': return v >= valor;
      case '<': return v < valor;
      case '<=': return v <= valor;
      case 'tem': return Array.isArray(v) && v.includes(valor);
      default: throw new Error('Operador inválido: ' + op);
    }
  }
  if (c.all) return c.all.every((x) => avaliar(x, p));
  if (c.any) return c.any.some((x) => avaliar(x, p));
  if (c.not) return !avaliar(c.not, p);
  throw new Error('Condição inválida');
}

function perfilDe(cfg, perfil) {
  const chave = perfil || cfg.perfilPadrao || 'manchester';
  const p = cfg.perfis && cfg.perfis[chave];
  return { chave, niveis: p ? p.niveis : cfg.niveis };
}

// `perfil` escolhe como o nível interno (1 a 5) é apresentado: 'manchester' ou 'atencaoBasica'.
// O nível interno e a ordem da fila não mudam com o perfil.
export function classificar(paciente, cfg, perfil) {
  cfg = cfg || REGRAS;
  const { chave, niveis } = perfilDe(cfg, perfil);
  const p = paciente;

  // 1) Risco biológico: regras e escores.
  const acionadas = cfg.regras
    .filter((r) => avaliar(r.condicao, p))
    .map((r) => ({ id: r.id, nivel: r.nivel, descricao: r.descricao, fonte: r.fonte }));
  (cfg.escores || []).forEach((e) => {
    if (!avaliar(e.aplicaSe, p)) return;
    const atendidos = e.criterios.filter((c) => avaliar(c.condicao, p));
    const faixa = e.niveis.find(([min]) => atendidos.length >= min);
    if (!faixa) return;
    acionadas.push({
      id: e.id, nivel: faixa[1], fonte: e.fonte,
      descricao: e.nome + ' = ' + atendidos.length + '/' + e.criterios.length +
        (atendidos.length ? ' (' + atendidos.map((c) => c.descricao).join('; ') + ')' : ''),
    });
  });
  const nivelBiologico = acionadas.length ? Math.min(...acionadas.map((r) => r.nivel)) : cfg.nivelPadrao;
  let nivel = nivelBiologico;

  // 2) Modificadores (só elevam, uma vez, nos níveis indicados).
  const modificadores = cfg.modificadores.filter((m) => m.niveis.includes(nivelBiologico) && avaliar(m.condicao, p));
  if (modificadores.length) nivel = Math.max(1, nivel - 1);

  // 3) Vulnerabilidade: só pode subir o atendimento até o nível mínimo da vulnerabilidade.
  const vulns = (cfg.vulnerabilidades || []).filter((v) => (p.vulnerabilidades || []).includes(v.id));
  const nivelVuln = vulns.length ? Math.min(...vulns.map((v) => v.nivelMinimo)) : null;
  const vulnElevou = nivelVuln !== null && nivel > nivelVuln;
  if (vulnElevou) nivel = nivelVuln;

  // 4) Alertas (informativos, não mudam o nível).
  const alertas = (cfg.alertas || []).filter((a) => avaliar(a.condicao, p)).map((a) => ({ id: a.id, texto: a.texto, fonte: a.fonte }));

  const info = niveis[nivel];
  const determinantes = acionadas.filter((r) => r.nivel === nivelBiologico);
  const explicacao = [];
  explicacao.push(acionadas.length
    ? 'Risco biológico (nível ' + nivelBiologico + '): ' + determinantes.map((r) => r.descricao + ' [' + r.fonte + ']').join('; ')
    : 'Nenhuma regra disparou: nível padrão (' + nivelBiologico + ')');
  modificadores.forEach((m) => explicacao.push('Elevado em 1 nível: ' + m.descricao + ' [' + m.fonte + ']'));
  if (vulns.length) {
    const txt = vulns.map((v) => v.descricao + ' [' + v.fonte + ']').join('; ');
    explicacao.push(vulnElevou
      ? 'Vulnerabilidade elevou o atendimento para o nível ' + nivelVuln + ': ' + txt
      : 'Vulnerabilidade registrada (não altera o nível): ' + txt);
  }

  return {
    versaoRegras: cfg.versao,
    perfil: chave,
    nivel, nome: info.nome, cor: info.cor,
    tempoMaxMin: info.tempoMaxMin,
    tempoReferenciaMin: info.tempoReferenciaMin !== undefined ? info.tempoReferenciaMin : info.tempoMaxMin,
    riscoBiologico: nivelBiologico,
    vulnerabilidades: vulns.map((v) => ({ id: v.id, descricao: v.descricao, nivelMinimo: v.nivelMinimo, fonte: v.fonte })),
    vulnerabilidadeElevouNivel: vulnElevou,
    regrasAcionadas: acionadas,
    modificadores: modificadores.map((m) => m.id),
    alertas,
    camposAusentes: SINAIS.filter((s) => p[s] === undefined || p[s] === null),
    explicacao,
  };
}

// Fila. disciplina 'estatica': menor nível primeiro; empate por chegada.
// disciplina 'folga' (slack): nível 1 sempre primeiro; os demais por menor folga
// (tempo limite - espera), o que evita espera excessiva nos níveis baixos (Lv et al., 2025).
// Na atenção básica só o atendimento imediato tem limite rígido; nos demais a folga usa o tempo
// de referência e `atrasado` fica sempre falso.
export function ordenarFila(lista, agora, cfg, disciplina, perfil) {
  const itens = lista.map((p) => {
    const c = classificar(p, cfg, perfil);
    const esperaMin = Math.max(0, Math.floor((agora - p.chegada) / 60000));
    const limite = c.tempoMaxMin !== null ? c.tempoMaxMin : c.tempoReferenciaMin;
    return { ...p, classificacao: c, esperaMin, folgaMin: limite - esperaMin, atrasado: c.tempoMaxMin !== null && esperaMin > c.tempoMaxMin };
  });
  const nv = (x) => x.classificacao.nivel;
  return itens.sort(disciplina === 'folga'
    ? (a, b) => (nv(a) === 1) !== (nv(b) === 1)
        ? (nv(a) === 1 ? -1 : 1)
        : a.folgaMin - b.folgaMin || nv(a) - nv(b) || a.chegada - b.chegada
    : (a, b) => nv(a) - nv(b) || a.chegada - b.chegada);
}