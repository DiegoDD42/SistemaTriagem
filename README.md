# Sistema de Triagem

Protótipo web de triagem e classificação de risco para a atenção básica, feito como Trabalho de Conclusão de Curso (Ciência da Computação).

O sistema recebe sinais vitais, queixas e fatores de vulnerabilidade de um paciente, classifica o risco em cinco níveis, explica a decisão citando a fonte de cada regra e organiza a fila de atendimento.

> **Aviso:** protótipo acadêmico. Não substitui a avaliação de um profissional de saúde. As regras não foram validadas clinicamente e não devem ser usadas em atendimento real.

## Funcionalidades

- Cadastro de paciente com nome, sinais vitais, sintomas e vulnerabilidades.
- Classificação de risco em cinco níveis, com cor, categoria e tempo de referência.
- Dois perfis de apresentação: **Manchester** e **Atenção Básica** (imediato, prioritário, no dia, não agudo). O nível interno e a ordem da fila não mudam com o perfil.
- Explicação de cada resultado, com as regras acionadas e suas fontes.
- Alertas que não alteram o nível (pseudocrise e urgência hipertensiva).
- Aviso de campos não informados. Dado ausente nunca dispara uma regra.
- Fila com dois modos de ordenação: por **prioridade** (nível e chegada) ou por **folga** (tempo restante até o tempo de referência).
- Indicação de atraso, calculada só para categorias com tempo máximo definido.
- Tempos de espera atualizados a cada 30 segundos.

## Como o risco é calculado

1. As regras e os escores da base são avaliados sobre os dados do paciente. O nível biológico é o mais urgente entre as regras acionadas, ou o nível padrão se nenhuma disparar.
2. Modificadores elevam o atendimento em um nível, apenas nos níveis 4 e 5.
3. Fatores de vulnerabilidade elevam a prioridade até um nível mínimo, sem nunca baixar o risco clínico.
4. Alertas e campos ausentes são registrados.
5. O nível é traduzido para o perfil escolhido.

Limiares de sinais vitais dependem da idade (por exemplo, a frequência respiratória usa 60, 50, 40, 30 e 25 conforme a faixa etária). Em adultos com suspeita de pneumonia, aplica-se o escore CRB-65.

Os tempos de 60, 120 e 240 minutos são de referência, definidos pelo grupo. Só a categoria "imediato" tem limite rígido.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| JavaScript (módulos ES) | Linguagem de toda a aplicação |
| React 18 | Interface por componentes e hooks |
| Vite | Servidor de desenvolvimento e build |
| React Bootstrap, Bootstrap, Bootstrap Icons | Componentes visuais e ícones |
| CSS (`App.css`) | Estilos complementares |
| Node.js e npm | Dependências e testes automatizados |

## Estrutura do projeto

```text
src/
├── components/        Checks.jsx, Resultado.jsx, Tempo.jsx
├── features/
│   ├── pacientes/     Formulario.jsx
│   └── fila/          Fila.jsx
├── data/              regras.js, sintomas.js
├── services/          motor.js
├── App.jsx
├── App.css
└── main.jsx
```

| Caminho | Responsabilidade |
| --- | --- |
| `data/regras.js` | Base de regras: níveis, perfis, categorias, vulnerabilidades e limiares por idade |
| `data/sintomas.js` | Catálogo de sintomas e campos de entrada |
| `services/motor.js` | Classificação de risco e ordenação da fila, sem dependência de React |
| `features/pacientes/Formulario.jsx` | Cadastro e classificação inicial |
| `features/fila/Fila.jsx` | Lista ordenada, tempo de espera e atraso |
| `components/` | Grupos de caixas de seleção, resultado e tempo |
| `App.jsx` | Estado da fila e do perfil selecionado |
| `main.jsx` | Ponto de entrada; carrega o Bootstrap e renderiza `App` |

A lógica de classificação fica separada da interface. Isso permite testá-la sem navegador e alterar as regras sem mexer nas telas.

## Como executar

Requisitos: Node.js 18 ou superior e npm. O projeto foi desenvolvido e testado com Node.js v24.21.0.

```bash
npm install
npm run dev       # abre a interface em modo de desenvolvimento
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a versão de produção localmente
npm test          # roda os testes automatizados do motor
```

Se instalar as dependências visuais do zero:

```bash
npm install react-bootstrap bootstrap bootstrap-icons
```

## Testes

`npm test` executa `testes.js` no Node.js e compara o nível obtido com o esperado para cada entrada. Os testes cobrem regras por faixa etária, o escore CRB-65, vulnerabilidades, alertas, modificadores e a ordenação da fila.

Também há 27 casos manuais para preencher na interface, em planilha, com o resultado esperado de cada um.

Os testes mostram que o motor aplica as regras como foram escritas. Eles não provam que as regras estão clinicamente corretas.

## Como alterar as regras

Edite `src/data/regras.js`. Cada regra tem:

- `condicao`: expressão como `['fc', '>', 110]` (frequência cardíaca acima de 110), combinável com `all`, `any` e `not`. Operadores: `==`, `!=`, `>`, `>=`, `<`, `<=` e `tem`.
- `nivel`: de 1 (mais urgente) a 5.
- `descricao`: texto exibido na explicação.
- `fonte`: onde a regra foi baseada.

Depois de alterar, rode `npm test`.

## Limitações

- A fila fica só na memória do navegador e é perdida ao recarregar a página.
- Não há banco de dados nem servidor. Uma integração futura com backend (por exemplo, Django) exigirá trocar a chamada local ao motor por uma chamada à API.
- O sistema depende dos dados digitados e não detecta erro de digitação.
- Sem validação clínica por profissionais habilitados.

## Fontes

As regras se baseiam somente em literatura acadêmica e nos Cadernos de Atenção Básica n. 28 do Ministério da Saúde:

- BRASIL. Ministério da Saúde. *Acolhimento à demanda espontânea*. Brasília, 2013. (Cadernos de Atenção Básica, n. 28, v. I).
- BRASIL. Ministério da Saúde. *Acolhimento à demanda espontânea: queixas mais comuns na Atenção Básica*. Brasília, 2013. (Cadernos de Atenção Básica, n. 28, v. II).

## Autores

Trabalho de Conclusão de Curso, Ciência da Computação, Unitri, 2026.

- Diego Dantas Domingues
- Heitor Marques Magalhães
- João Pedro Ribeiro Lourenço
- Marcos Vinícius Cardoso Araújo