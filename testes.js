// Rodar: node testes.js
import assert from 'assert';
import { classificar, ordenarFila } from './src/services/motor.js';
const casos = [
  ['Parada cardiorrespiratória', { sintomas: ['parada_cardiorrespiratoria'] }, 1],
  ['SpO2 88', { spo2: 88 }, 1],
  ['GCS 7', { glasgow: 7 }, 1],
  ['Dor torácica cardíaca', { sintomas: ['dor_toracica_cardiaca'] }, 2],
  ['Hemorragia incontrolável é nível 2', { sintomas: ['hemorragia_incontrolavel'] }, 2],
  ['SpO2 93 com oxigênio', { spo2: 93, sintomas: ['em_oxigenio'] }, 2],
  ['SpO2 93 em ar ambiente', { spo2: 93 }, 3],
  ['GCS 11', { glasgow: 11 }, 2],
  ['Dor 8', { dor: 8 }, 2],
  ['Dor 5', { dor: 5 }, 3],
  ['Dor 2', { dor: 2 }, 4],
  ['Idoso hipotenso (PAS 95)', { idade: 70, pas: 95 }, 2],
  ['Adulto com PAS 95 não dispara regra de idoso', { idade: 40, pas: 95 }, 4],
  ['Febre em lactente', { idade: 0.5, temp: 38.3 }, 3],
  ['Dor abdominal aguda', { sintomas: ['dor_abdominal_aguda'] }, 3],
  ['Ferida superficial', { sintomas: ['ferida_superficial'] }, 4],
  ['Retirada de pontos', { sintomas: ['procedimento_rotina'] }, 5],
  ['Retirada de pontos em idoso sobe 1 nível', { idade: 85, sintomas: ['procedimento_rotina'] }, 4],
  ['Comorbidade sobe 1 nível', { sintomas: ['procedimento_rotina', 'comorbidades'] }, 4],
  ['Sem dados: padrão conservador', {}, 4],
  ['Nível 1 não sobe com modificador', { idade: 85, spo2: 85 }, 1],
  ['Dado ausente não dispara regra', { fc: 140 }, 2],
  // v0.3: anafilaxia, taquipneia por idade, glicemia, pressão, escore
  ['Suspeita de anafilaxia', { sintomas: ['anafilaxia_suspeita'] }, 1],
  ['Rebaixamento de consciência', { sintomas: ['rebaixamento_consciencia'] }, 1],
  ['FR 52 aos 6 meses (limite 50)', { idade: 0.5, fr: 52 }, 3],
  ['FR 42 aos 3 anos (limite 40)', { idade: 3, fr: 42 }, 3],
  ['FR 38 aos 3 anos (normal)', { idade: 3, fr: 38 }, 4],
  ['FR 28 aos 7 anos (limite 30)', { idade: 7, fr: 28 }, 4],
  ['FR 32 aos 7 anos', { idade: 7, fr: 32 }, 3],
  ['FR 24 em adulto (limite 25)', { idade: 40, fr: 24 }, 4],
  ['FR 26 em adulto', { idade: 40, fr: 26 }, 3],
  ['FR alta sem idade informada: limiar por idade não se aplica', { fr: 45 }, 4],
  ['Pneumonia: cianose central', { sintomas: ['cianose_central'] }, 2],
  ['Pneumonia em lactente < 2 meses', { idade: 0.1, sintomas: ['suspeita_pneumonia'] }, 2],
  ['CRB-65 = 3 (FR, PAD, idade) em adulto', { idade: 70, fr: 31, pad: 55, sintomas: ['suspeita_pneumonia'] }, 2],
  ['Glicemia 50', { glicemia: 50 }, 3],
  ['Glicemia 90', { glicemia: 90 }, 4],
  ['PAD 125 sem lesão: urgência hipertensiva', { pad: 125 }, 3],
  ['PAD 125 com lesão de órgão-alvo: emergência', { pad: 125, sintomas: ['lesao_orgao_alvo'] }, 1],
  ['Febre 38 sem complicação', { temp: 38 }, 3],
];
casos.forEach(([nome, p, esperado]) => {
  assert.strictEqual(classificar(p).nivel, esperado, nome);
  console.log('ok  ', nome);
});
const r = classificar({ spo2: 85 });
assert.ok(r.explicacao[0].includes('Zachariasse') && r.versaoRegras && r.camposAusentes.includes('fc'));
console.log('ok   explicação traz fonte, versão e campos ausentes');

const t = Date.now(), min = 60000;
const lista = [
  { id: 'a', chegada: t - 115 * min, sintomas: ['trauma_menor'] },       // nível 4, folga 5
  { id: 'b', chegada: t - 5 * min, spo2: 85 },                            // nível 1
  { id: 'c', chegada: t - 2 * min, sintomas: ['cefaleia_persistente'] },  // nível 3, folga 58
];
assert.deepStrictEqual(ordenarFila(lista, t).map((x) => x.id), ['b', 'c', 'a']);
assert.deepStrictEqual(ordenarFila(lista, t, undefined, 'folga').map((x) => x.id), ['b', 'a', 'c']);
console.log('ok   fila: prioridade por nível e por folga');

// FR 48 aos 6 meses não é taquipneia (limite 50); o nível 3 vem só do modificador de lactente (< 2 anos)
let c = classificar({ idade: 0.5, fr: 48 });
assert.ok(!c.regrasAcionadas.some((x) => x.id === 'R22') && c.riscoBiologico === 4 && c.nivel === 3);
console.log('ok   FR 48 aos 6 meses: sem taquipneia, lactente sobe 1 nível');

// CRB-65 só em adultos, e aparece nas regras acionadas
c = classificar({ idade: 70, fr: 31, pad: 55, sintomas: ['suspeita_pneumonia'] });
assert.ok(c.regrasAcionadas.some((x) => x.id === 'ESC1' && x.nivel === 2));
c = classificar({ idade: 10, fr: 35, sintomas: ['suspeita_pneumonia'] });
assert.ok(!c.regrasAcionadas.some((x) => x.id === 'ESC1'));
console.log('ok   escore CRB-65: só adultos, entra nas regras acionadas');

// Alertas não mudam o nível
c = classificar({ pad: 125 });
assert.ok(c.alertas.some((a) => a.id === 'A02') && c.nivel === 3);
c = classificar({ pad: 125, sintomas: ['lesao_orgao_alvo'] });
assert.ok(!c.alertas.some((a) => a.id === 'A02'));
c = classificar({ pad: 125, sintomas: ['ansiedade_significativa'] });
assert.ok(c.alertas.some((a) => a.id === 'A01'));
console.log('ok   alertas de pressão arterial');

// Vulnerabilidade: só sobe o atendimento, nunca desce
c = classificar({ sintomas: ['procedimento_rotina'], vulnerabilidades: ['vulnerabilidade_social'] });
assert.strictEqual(c.nivel, 4); assert.strictEqual(c.riscoBiologico, 5); assert.ok(c.vulnerabilidadeElevouNivel);
c = classificar({ sintomas: ['procedimento_rotina'], vulnerabilidades: ['suspeita_violencia'] });
assert.strictEqual(c.nivel, 3);
c = classificar({ spo2: 85, vulnerabilidades: ['vulnerabilidade_social'] });
assert.strictEqual(c.nivel, 1); assert.ok(!c.vulnerabilidadeElevouNivel);
c = classificar({ dor: 5, vulnerabilidades: ['vulnerabilidade_social'] });
assert.strictEqual(c.nivel, 3); assert.ok(!c.vulnerabilidadeElevouNivel);
assert.ok(c.explicacao.some((e) => e.includes('Vulnerabilidade')));
console.log('ok   vulnerabilidade só eleva, e é explicada');

// Perfis: o nível interno é o mesmo, muda a apresentação
const m = classificar({ spo2: 85 }, undefined, 'manchester');
const ab = classificar({ spo2: 85 }, undefined, 'atencaoBasica');
assert.strictEqual(m.nivel, ab.nivel); assert.notStrictEqual(m.nome, ab.nome);
assert.strictEqual(ab.tempoMaxMin, 0);
const ab3 = classificar({ dor: 5 }, undefined, 'atencaoBasica');
assert.strictEqual(ab3.tempoMaxMin, null); assert.strictEqual(ab3.tempoReferenciaMin, 60);
console.log('ok   perfis Manchester e atenção básica (MS)');

// Atenção básica: sem limite rígido, logo nunca "atrasado" (exceto imediato)
const L = [{ id: 'x', chegada: t - 300 * min, sintomas: ['trauma_menor'] }];
assert.strictEqual(ordenarFila(L, t, undefined, 'estatica', 'manchester')[0].atrasado, true);
assert.strictEqual(ordenarFila(L, t, undefined, 'estatica', 'atencaoBasica')[0].atrasado, false);
console.log('ok   fila: atraso só onde há limite rígido');

console.log('\nTodos os testes passaram.');