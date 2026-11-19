// Base de regras da triagem (dados, não código). Edite à vontade.
// Condição: ['campo','op','valor'] | {all:[...]} | {any:[...]} | {not:...}
// Operadores: == != > >= < <= tem (array de sintomas contém o valor)
// Valor pode ser uma tabela por idade: { porIdadeMeses: [[ate_meses_exclusivo, valor], ...], senao: valor }
// Nível 1 = mais grave ... 5 = menos grave. Idade em anos (aceita decimais).
// `fonte` indica de onde vem cada regra. Onde a literatura traz só uma faixa ou não traz
// número, o limiar ou o mapeamento foi ADOTADO pelo grupo e está marcado como tal.
const REGRAS = (() => {
  const S = (x) => ['sintomas', 'tem', x];
  const Z21 = 'Zachariasse et al., 2021', Z17 = 'Zachariasse et al., 2017', BAR = 'Barfod et al., 2012',
    VV = 'Van Veen et al., 2008', VW = 'Van Wegen et al., 2025', SU = 'Su et al., 2022',
    JES = 'Jesus et al., 2021', HIN = 'Hinson et al., 2018', CHA = 'Cha et al., 2026', YAZ = 'Yazici et al., 2024';
  const MS1 = 'Brasil, 2013a (Cad. AB 28, v. I)';
  const ms2 = (cap) => 'Brasil, 2013b (Cad. AB 28, v. II, cap. ' + cap + ')';
  const ADOT = ' (limiar adotado pelo grupo)';
  const MAPA = ' (mapeamento para nível adotado pelo grupo)';

  // Taquipneia por idade (Brasil, 2013b, Quadro 22): > 60 até 2 meses; > 50 de 3 a 12 meses;
  // > 40 de 13 meses a 5 anos; > 30 de 6 a 8 anos; > 25 a partir de 8 anos e adultos.
  const TAQUIPNEIA = { porIdadeMeses: [[3, 60], [13, 50], [72, 40], [96, 30]], senao: 25 };

  const MANCHESTER = {
    1: { nome: 'Emergência', cor: '#b3261e', tempoMaxMin: 0 },
    2: { nome: 'Muito urgente', cor: '#d9631e', tempoMaxMin: 10 },
    3: { nome: 'Urgente', cor: '#b8860b', tempoMaxMin: 60 },
    4: { nome: 'Pouco urgente', cor: '#2f7d4f', tempoMaxMin: 120 },
    5: { nome: 'Não urgente', cor: '#2563a8', tempoMaxMin: 240 },
  }; // tempos do Manchester (Mendes, 2017; Zakeri et al., 2022)

  // Atenção básica (Brasil, 2013a/2013b): não agudo + 3 categorias agudas, sem limite rígido de
  // tempo, exceto no atendimento imediato. `tempoReferenciaMin` só ordena a fila (disciplina por
  // folga), não gera alerta de atraso.
  const ATENCAO_BASICA = {
    1: { nome: 'Atendimento imediato', cor: '#b3261e', tempoMaxMin: 0, tempoReferenciaMin: 0 },
    2: { nome: 'Atendimento imediato', cor: '#b3261e', tempoMaxMin: 0, tempoReferenciaMin: 10 },
    3: { nome: 'Atendimento prioritário', cor: '#b8860b', tempoMaxMin: null, tempoReferenciaMin: 60 },
    4: { nome: 'Atendimento no dia', cor: '#2f7d4f', tempoMaxMin: null, tempoReferenciaMin: 120 },
    5: { nome: 'Situação não aguda', cor: '#2563a8', tempoMaxMin: null, tempoReferenciaMin: 240 },
  };

  return {
    versao: '0.3-cadernos-ms',
    nivelPadrao: 4, // sem regra acionada: nível conservador, para evitar subtriagem
    perfilPadrao: 'manchester',
    niveis: MANCHESTER,
    perfis: {
      manchester: { nome: 'Pronto-atendimento (Manchester)', niveis: MANCHESTER },
      atencaoBasica: {
        nome: 'Atenção básica (Ministério da Saúde)',
        niveis: ATENCAO_BASICA,
        fonte: MS1 + '; ' + ms2('1.1') + MAPA + ': níveis 1 e 2 = imediato, 3 = prioritário, 4 = no dia, 5 = não agudo',
      },
    },
    regras: [
      // Nível 1
      { id: 'R01', nivel: 1, descricao: 'Via aérea comprometida', condicao: S('via_aerea_comprometida'), fonte: Z17 + '; ' + VV },
      { id: 'R02', nivel: 1, descricao: 'Ausência de reatividade neurológica', condicao: S('sem_reatividade_neurologica'), fonte: Z17 + '; ' + VV },
      { id: 'R03', nivel: 1, descricao: 'Convulsão ativa', condicao: S('convulsao_ativa'), fonte: BAR + '; ' + VW + '; ' + VV + '; ' + ms2('1.1') },
      { id: 'R04', nivel: 1, descricao: 'Parada cardiorrespiratória', condicao: S('parada_cardiorrespiratoria'), fonte: BAR + '; ' + VW + '; ' + VV + '; ' + ms2('1.1') },
      { id: 'R05', nivel: 1, descricao: 'Choque circulatório', condicao: S('choque_circulatorio'), fonte: BAR + '; ' + VW + '; ' + VV },
      { id: 'R06', nivel: 1, descricao: 'SpO₂ < 90%', condicao: ['spo2', '<', 90], fonte: Z21 + '; ' + BAR + '; ' + SU },
      { id: 'R07', nivel: 1, descricao: 'Glasgow 3–8', condicao: ['glasgow', '<=', 8], fonte: Z21 + '; ' + BAR + '; ' + SU },
      { id: 'R08', nivel: 1, descricao: 'PAS < 80 mmHg', condicao: ['pas', '<', 80], fonte: Z21 + '; ' + BAR + ' (faixa 70–80, usado o limite superior)' },
      { id: 'R09', nivel: 1, descricao: 'Bradipneia (FR < 8)', condicao: ['fr', '<', 8], fonte: Z21 + ADOT },
      { id: 'R37', nivel: 1, descricao: 'Suspeita de anafilaxia', condicao: S('anafilaxia_suspeita'), fonte: ms2('2.1') + ': tratamento imediato, sem aguardar confirmação diagnóstica' },
      { id: 'R38', nivel: 1, descricao: 'Rebaixamento do nível de consciência', condicao: S('rebaixamento_consciencia'), fonte: ms2('1.1') + ': atendimento imediato' },
      { id: 'R41', nivel: 1, descricao: 'Emergência hipertensiva (PAD > 120 com lesão de órgão-alvo)', condicao: { all: [['pad', '>', 120], S('lesao_orgao_alvo')] }, fonte: ms2('2.14') + ': remoção imediata' },

      // Nível 2
      { id: 'R10', nivel: 2, descricao: 'Dor torácica de provável origem cardíaca', condicao: S('dor_toracica_cardiaca'), fonte: BAR + '; ' + VW + '; ' + ms2('2.13') },
      { id: 'R11', nivel: 2, descricao: 'Dispneia aguda grave', condicao: S('dispneia_grave'), fonte: BAR + '; ' + VW + '; ' + ms2('1.1') },
      { id: 'R12', nivel: 2, descricao: 'Perda súbita de consciência', condicao: S('perda_consciencia_subita'), fonte: BAR + '; ' + VW },
      { id: 'R13', nivel: 2, descricao: 'Início superagudo de déficit neurológico', condicao: S('deficit_neurologico_subito'), fonte: Z17 + '; ' + HIN + '; ' + VV },
      { id: 'R14', nivel: 2, descricao: 'Hemorragia incontrolável', condicao: S('hemorragia_incontrolavel'), fonte: Z17 + '; ' + HIN + '; ' + VV },
      { id: 'R15', nivel: 2, descricao: 'Dor intensa (VAS ≥ 8)', condicao: ['dor', '>=', 8], fonte: Z17 + '; ' + HIN + '; ' + VV + '; ' + ms2('1.1') + ' (dor severa)' },
      { id: 'R16', nivel: 2, descricao: 'SpO₂ < 95% com oxigênio suplementar', condicao: { all: [['spo2', '<', 95], S('em_oxigenio')] }, fonte: Z21 + '; ' + SU + '; ' + JES },
      { id: 'R17', nivel: 2, descricao: 'Glasgow 9–13', condicao: { all: [['glasgow', '>=', 9], ['glasgow', '<=', 13]] }, fonte: Z21 + '; ' + SU + '; ' + JES },
      { id: 'R18', nivel: 2, descricao: 'FC > 130 bpm', condicao: ['fc', '>', 130], fonte: Z21 + ' (faixa 120–140, usado o ponto médio)' },
      { id: 'R19', nivel: 2, descricao: 'Lactente com FR ≥ 55', condicao: { all: [['idade', '<', 1], ['fr', '>=', 55]] }, fonte: Z21 + '; ' + SU + '; ' + JES },
      { id: 'R35', nivel: 2, descricao: 'Idoso (≥ 65) com PAS < 100', condicao: { all: [['idade', '>=', 65], ['pas', '<', 100]] }, fonte: SU + ': limiar ajustado para idosos' + ADOT },
      { id: 'R36', nivel: 2, descricao: 'Idoso (≥ 65) com bradicardia severa (FC < 50)', condicao: { all: [['idade', '>=', 65], ['fc', '<', 50]] }, fonte: SU + ': limiar ajustado para idosos' + ADOT },
      { id: 'R42', nivel: 2, descricao: 'Sinal de gravidade de pneumonia (cianose central, tiragem subcostal ou incapacidade de beber)', condicao: { any: [S('cianose_central'), S('tiragem_subcostal'), S('incapacidade_beber')] }, fonte: ms2('2.6') + ', Quadro 23: referir urgentemente' },
      { id: 'R43', nivel: 2, descricao: 'Suspeita de pneumonia em lactente < 2 meses', condicao: { all: [S('suspeita_pneumonia'), ['idade', '<', 2 / 12]] }, fonte: ms2('2.6') + ': considerada grave, indicação de internação' },
      { id: 'R56', nivel: 2, descricao: 'Confusão mental', condicao: S('confusao_mental'), fonte: ms2('2.6') + ' (critério do CRB-65); coerente com Glasgow 9–13' + MAPA },

      // Nível 3
      { id: 'R20', nivel: 3, descricao: 'SpO₂ < 95% em ar ambiente', condicao: ['spo2', '<', 95], fonte: Z21 + '; ' + HIN },
      { id: 'R21', nivel: 3, descricao: 'Dor moderada (VAS 4–7)', condicao: ['dor', '>=', 4], fonte: Z17 + '; ' + JES + '; ' + HIN },
      { id: 'R22', nivel: 3, descricao: 'Taquipneia para a idade', condicao: ['fr', '>', TAQUIPNEIA], fonte: ms2('2.6') + ', Quadro 22 (> 60 até 2 meses; > 50 aos 3–12 meses; > 40 aos 13 meses–5 anos; > 30 aos 6–8 anos; > 25 a partir de 8 anos e adultos)' },
      { id: 'R23', nivel: 3, descricao: 'Taquicardia (FC > 110)', condicao: ['fc', '>', 110], fonte: Z21 + '; ' + HIN + ADOT },
      { id: 'R24', nivel: 3, descricao: 'Cefaleia persistente', condicao: S('cefaleia_persistente'), fonte: VW + '; ' + Z17 + '; ' + YAZ },
      { id: 'R25', nivel: 3, descricao: 'Dor abdominal aguda', condicao: S('dor_abdominal_aguda'), fonte: VW + '; ' + Z17 + '; ' + YAZ + '; ' + ms2('1.1') + ' (gestante com dor abdominal)' },
      { id: 'R26', nivel: 3, descricao: 'Vômitos incoercíveis', condicao: S('vomitos_incoerciveis'), fonte: VW + '; ' + Z17 + '; ' + YAZ },
      { id: 'R27', nivel: 3, descricao: 'Sangramento menor persistente', condicao: S('sangramento_persistente'), fonte: Z17 + '; ' + JES + '; ' + HIN },
      { id: 'R28', nivel: 3, descricao: 'Febre em lactente', condicao: { all: [['idade', '<', 1], ['temp', '>=', 38]] }, fonte: Z17 + '; ' + JES + '; ' + HIN + ' (corte de 38 °C adotado)' },
      { id: 'R33', nivel: 3, descricao: 'Febre sem complicação (≥ 37,8 °C)', condicao: ['temp', '>=', 37.8], fonte: ms2('1.1') + ': febre sem complicação é atendimento prioritário (corte de 37,8 °C adotado)' },
      { id: 'R44', nivel: 3, descricao: 'Glicemia < 60 mg/dl', condicao: ['glicemia', '<', 60], fonte: ms2('2.4') + ': hipoglicemia (< 60 mg/dl)' + MAPA },
      { id: 'R45', nivel: 3, descricao: 'Urgência hipertensiva (PAD > 120)', condicao: ['pad', '>', 120], fonte: ms2('2.14') + ': controle em até 24 h' + MAPA },
      { id: 'R46', nivel: 3, descricao: 'Crise asmática leve ou moderada', condicao: S('crise_asmatica'), fonte: ms2('1.1') + ': atendimento prioritário' },
      { id: 'R47', nivel: 3, descricao: 'Ansiedade significativa', condicao: S('ansiedade_significativa'), fonte: ms2('1.1') + ': atendimento prioritário' },
      { id: 'R48', nivel: 3, descricao: 'Suspeita de doença transmissível', condicao: S('suspeita_doenca_transmissivel'), fonte: ms2('1.1') + ': atendimento prioritário' },

      // Nível 4
      { id: 'R30', nivel: 4, descricao: 'Dor leve (VAS 1–3)', condicao: ['dor', '>=', 1], fonte: JES + '; ' + HIN + '; ' + VV },
      { id: 'R31', nivel: 4, descricao: 'Traumatismo menor de extremidade', condicao: S('trauma_menor'), fonte: VW + '; ' + Z17 + '; ' + JES },
      { id: 'R32', nivel: 4, descricao: 'Ferida limpa superficial', condicao: S('ferida_superficial'), fonte: VW + '; ' + Z17 + '; ' + JES },
      { id: 'R50', nivel: 4, descricao: 'Disúria', condicao: S('disuria'), fonte: ms2('1.1') + ': atendimento no dia' },
      { id: 'R51', nivel: 4, descricao: 'Tosse sem sinais de risco', condicao: S('tosse_sem_risco'), fonte: ms2('1.1') + ': atendimento no dia' },
      { id: 'R52', nivel: 4, descricao: 'Dor lombar leve', condicao: S('dor_lombar_leve'), fonte: ms2('1.1') + ': atendimento no dia' },
      { id: 'R53', nivel: 4, descricao: 'Medicamento de uso contínuo que já terminou', condicao: S('medicamento_continuo_terminou'), fonte: ms2('1.1') + ': atendimento no dia' },

      // Nível 5
      { id: 'R40', nivel: 5, descricao: 'Sintoma inespecífico, queixa crônica ou procedimento de rotina', condicao: { any: [S('sintoma_inespecifico'), S('queixa_cronica'), S('procedimento_rotina')] }, fonte: VW + '; ' + JES },
    ],

    // Escores: somam critérios atendidos e convertem o total em nível. `niveis` = [[minPontos, nivel], ...],
    // testados em ordem. Critério com dado ausente conta como não atendido.
    escores: [
      {
        id: 'ESC1', nome: 'CRB-65', aplicaSe: { all: [S('suspeita_pneumonia'), ['idade', '>=', 18]] },
        criterios: [
          { descricao: 'confusão mental', condicao: S('confusao_mental') },
          { descricao: 'FR ≥ 30', condicao: ['fr', '>=', 30] },
          { descricao: 'PAS < 90 ou PAD ≤ 60', condicao: { any: [['pas', '<', 90], ['pad', '<=', 60]] } },
          { descricao: 'idade > 65', condicao: ['idade', '>', 65] },
        ],
        niveis: [[3, 2], [2, 3], [0, 4]],
        fonte: ms2('2.6') + ': 0–1 tratamento domiciliar, 2 tratamento hospitalar, 3–4 internação' + MAPA,
      },
    ],

    // Vulnerabilidade: segunda dimensão, separada do risco biológico. Só pode SUBIR o atendimento
    // até `nivelMinimo` (nunca baixa o risco biológico). Atenção básica: Brasil, 2013a, seção 3.3.
    vulnerabilidades: [
      { id: 'sem_acesso_outro_momento', descricao: 'Não conseguirá acessar o serviço em outro momento', nivelMinimo: 4, fonte: ms2('1.1') + ': atendimento no dia' },
      { id: 'crianca_sem_puericultura', descricao: 'Criança desnutrida sem puericultura há meses', nivelMinimo: 4, fonte: MS1 + ', seção 3.3' },
      { id: 'primeira_vez_apos_anos', descricao: 'Primeira ida ao serviço após muitos anos', nivelMinimo: 4, fonte: MS1 + ', seção 3.3' },
      { id: 'vulnerabilidade_social', descricao: 'Vulnerabilidade social importante (trabalho informal, cuida sozinha de menores)', nivelMinimo: 4, fonte: MS1 + ', seção 3.3' },
      { id: 'conflito_familiar', descricao: 'Conflito familiar', nivelMinimo: 4, fonte: ms2('1.1') + ': atendimento no dia' },
      { id: 'suspeita_violencia', descricao: 'Suspeita de violência ou negligência', nivelMinimo: 3, fonte: ms2('1.1') + ': atendimento prioritário' },
    ],

    // Alertas: avisos que NÃO mudam o nível.
    alertas: [
      { id: 'A01', condicao: { all: [['pad', '>', 120], { any: [['dor', '>=', 1], S('ansiedade_significativa')] }] }, texto: 'PA muito elevada com dor ou ansiedade: avaliar pseudocrise hipertensiva e tratar a causa antes de usar anti-hipertensivo.', fonte: ms2('2.14') },
      { id: 'A02', condicao: { all: [['pad', '>', 120], { not: S('lesao_orgao_alvo') }] }, texto: 'PAD > 120 sem lesão de órgão-alvo: urgência hipertensiva; a PA pode ser controlada em até 24 h, por via oral.', fonte: ms2('2.14') },
    ],

    // Elevam o nível em 1 (uma única vez) quando o caso está nos níveis indicados.
    modificadores: [
      { id: 'M01', descricao: 'Idoso (≥ 80 anos)', condicao: ['idade', '>=', 80], niveis: [4, 5], fonte: SU + ADOT },
      { id: 'M02', descricao: 'Criança pequena (< 2 anos)', condicao: ['idade', '<', 2], niveis: [4, 5], fonte: Z21 + ADOT },
      { id: 'M03', descricao: 'Comorbidades prévias', condicao: S('comorbidades'), niveis: [4, 5], fonte: CHA + '; ' + YAZ },
    ],
  };
})();

export default REGRAS;