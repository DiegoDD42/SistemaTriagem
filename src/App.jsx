
import { useState } from 'react';

import {
  Badge,
  Col,
  Container,
  Row
} from 'react-bootstrap';

import REGRAS from './data/regras.js';

import Formulario from './features/pacientes/Formulario.jsx';
import Fila from './features/fila/Fila.jsx';

export default function App() {
  const [fila, setFila] = useState([]);
  const [perfil, setPerfil] = useState(REGRAS.perfilPadrao);

  const adicionar = (p) => {
    setFila((l) => [
      ...l,
      {
        ...p,
        id: l.length + 1,
        nome: p.nome || `Paciente ${l.length + 1}`
      }
    ]);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Container fluid="lg">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-3">
                <div className="header-icon">
                  <i className="bi bi-heart-pulse" />
                </div>

                <div>
                  <h1 className="h4 mb-1">
                    Sistema de Triagem
                  </h1>

                  <p className="mb-0 text-white-50 small">
                    Classificação de risco e gerenciamento de fila
                  </p>
                </div>
              </div>
            </Col>

            <Col xs="auto">
              <Badge bg="light" text="dark" className="p-2">
                Protótipo acadêmico
              </Badge>
            </Col>
          </Row>
        </Container>
      </header>

      <Container fluid="lg" className="py-4">
        <Row className="g-4">
          <Col xs={12} lg={5}>
            <Formulario
              perfil={perfil}
              onAdd={adicionar}
            />
          </Col>

          <Col xs={12} lg={7}>
            <Fila
              fila={fila}
              perfil={perfil}
              setPerfil={setPerfil}
            />
          </Col>
        </Row>
      </Container>

      <footer className="app-footer">
        <Container fluid="lg">
          <small>
            Sistema acadêmico de apoio à triagem.
            As classificações exigem validação profissional.
          </small>
        </Container>
      </footer>
    </div>
  );
}
