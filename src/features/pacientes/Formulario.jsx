
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row
} from 'react-bootstrap';

import REGRAS from '../../data/regras.js';
import { classificar } from '../../services/motor.js';
import { SINTOMAS, CAMPOS } from '../../data/sintomas.js';

import Checks from '../../components/Checks.jsx';
import Resultado from '../../components/Resultado.jsx';

const vazio = () => ({
  nome: '',
  valores: {},
  sintomas: [],
  vulnerabilidades: []
});

export default function Formulario({ perfil, onAdd }) {
  const [f, setF] = useState(vazio);
  const [ultimo, setUltimo] = useState(null);

  const alternar = (campo) => (id) => {
    setF((atual) => ({
      ...atual,
      [campo]: atual[campo].includes(id)
        ? atual[campo].filter((x) => x !== id)
        : [...atual[campo], id]
    }));
  };

  const enviar = (e) => {
    e.preventDefault();

    const paciente = {
      nome: f.nome.trim(),
      chegada: Date.now(),
      sintomas: f.sintomas,
      vulnerabilidades: f.vulnerabilidades
    };

    Object.entries(f.valores).forEach(([k, v]) => {
      if (v !== '') {
        paciente[k] = Number(v);
      }
    });

    const classificacao = classificar(
      paciente,
      undefined,
      perfil
    );

    setUltimo(classificacao);
    onAdd(paciente);
    setF(vazio());
  };

  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-white border-bottom py-3">
        <h5 className="mb-1">
          <i className="bi bi-person-plus me-2 text-primary" />
          Novo paciente
        </h5>

        <small className="text-muted">
          Preencha os dados para realizar a classificação de risco.
        </small>
      </Card.Header>

      <Card.Body>
        <Form onSubmit={enviar}>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              Nome do paciente
            </Form.Label>

            <Form.Control
              type="text"
              placeholder="Digite o nome do paciente"
              value={f.nome}
              onChange={(e) =>
                setF((atual) => ({
                  ...atual,
                  nome: e.target.value
                }))
              }
            />
          </Form.Group>

          <div className="mb-3">
            <h6 className="fw-bold mb-3">
              Dados e sinais vitais
            </h6>

            <Row className="g-3">
              {CAMPOS.map(([id, rotulo, attrs]) => (
                <Col xs={12} sm={6} key={id}>
                  <Form.Group>
                    <Form.Label>{rotulo}</Form.Label>

                    <Form.Control
                      type="number"
                      {...attrs}
                      value={f.valores[id] ?? ''}
                      onChange={(e) =>
                        setF((atual) => ({
                          ...atual,
                          valores: {
                            ...atual.valores,
                            [id]: e.target.value
                          }
                        }))
                      }
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </div>

          <hr />

          <Form.Group className="mb-4">
            <h6 className="fw-bold mb-3">
              Sinais e queixas
            </h6>

            <Checks
              itens={Object.entries(SINTOMAS)}
              marcados={f.sintomas}
              onToggle={alternar('sintomas')}
            />
          </Form.Group>

          <hr />

          <Form.Group className="mb-4">
            <h6 className="fw-bold mb-1">
              Vulnerabilidades
            </h6>

            <p className="text-muted small">
              A seleção de vulnerabilidades pode aumentar a prioridade,
              mas nunca reduzi-la.
            </p>

            <Checks
              itens={REGRAS.vulnerabilidades.map((v) => [
                v.id,
                v.descricao
              ])}
              marcados={f.vulnerabilidades}
              onToggle={alternar('vulnerabilidades')}
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 py-2"
          >
            <i className="bi bi-clipboard-check me-2" />
            Classificar e adicionar à fila
          </Button>
        </Form>

        {ultimo && <Resultado c={ultimo} />}
      </Card.Body>
    </Card>
  );
}
