
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Badge,
  Card,
  Form,
  ListGroup,
  Stack
} from 'react-bootstrap';

import REGRAS from '../../data/regras.js';
import { ordenarFila } from '../../services/motor.js';

import Tempo from '../../components/Tempo.jsx';

export default function Fila({ fila, perfil, setPerfil }) {
  const [disc, setDisc] = useState('estatica');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTick((n) => n + 1);
    }, 30000);

    return () => clearInterval(t);
  }, []);

  const lista = useMemo(
    () => ordenarFila(
      fila,
      Date.now(),
      undefined,
      disc,
      perfil
    ),
    [fila, tick, disc, perfil]
  );

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white border-bottom py-3">
        <Stack
          direction="horizontal"
          className="justify-content-between flex-wrap gap-2"
        >
          <div>
            <h5 className="mb-1">
              <i className="bi bi-people me-2 text-primary" />
              Fila de atendimento
            </h5>

            <small className="text-muted">
              {fila.length} paciente(s) cadastrado(s)
            </small>
          </div>

          <Badge bg="primary" pill className="fs-6">
            {lista.length} na fila
          </Badge>
        </Stack>
      </Card.Header>

      <Card.Body>
        <Stack gap={3} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold">
              Perfil de classificação
            </Form.Label>

            <Form.Select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
            >
              {Object.entries(REGRAS.perfis).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.nome}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="fw-semibold">
              Ordenação da fila
            </Form.Label>

            <Form.Select
              value={disc}
              onChange={(e) => setDisc(e.target.value)}
            >
              <option value="estatica">
                Prioridade por nível
              </option>

              <option value="folga">
                Por folga até o tempo limite
              </option>
            </Form.Select>
          </Form.Group>
        </Stack>

        {lista.length === 0 ? (
          <Alert variant="light" className="text-center py-5">
            <i className="bi bi-inbox display-4 text-muted" />

            <h6 className="mt-3">
              Nenhum paciente na fila
            </h6>

            <p className="text-muted mb-0">
              Cadastre um paciente para iniciar o atendimento.
            </p>
          </Alert>
        ) : (
          <ListGroup as="ol" numbered className="fila-lista">
            {lista.map((p) => {
              const c = p.classificacao;

              return (
                <ListGroup.Item
                  as="li"
                  key={p.id}
                  className="fila-item"
                  style={{
                    '--cor-classificacao': c.cor
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold mb-1">
                        {p.nome}
                      </h6>

                      <div className="text-muted small">
                        {c.nome}
                      </div>
                    </div>

                    <Badge bg="dark">
                      Nível {c.nivel}
                    </Badge>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                    <Badge bg="light" text="dark">
                      <i className="bi bi-clock me-1" />
                      Espera: {p.esperaMin} min
                    </Badge>

                    <Tempo c={c} />

                    {p.atrasado && (
                      <Badge bg="danger">
                        Acima do limite
                      </Badge>
                    )}

                    {c.vulnerabilidadeElevouNivel && (
                      <Badge bg="warning" text="dark">
                        Prioridade elevada por vulnerabilidade
                      </Badge>
                    )}
                  </div>

                  {c.alertas.map((a) => (
                    <Alert
                      key={a.id}
                      variant="warning"
                      className="mt-3 mb-0 py-2"
                    >
                      <i className="bi bi-exclamation-triangle me-2" />
                      {a.texto}
                    </Alert>
                  ))}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>

      <Card.Footer className="bg-white text-muted small">
        <i className="bi bi-info-circle me-1" />
        Protótipo acadêmico. Não substitui avaliação profissional.
      </Card.Footer>
    </Card>
  );
}
