
import { Alert, Badge, ListGroup } from 'react-bootstrap';

export default function Resultado({ c }) {
  return (
    <Alert
      variant="light"
      className="resultado-card mt-4"
      style={{ borderLeft: `5px solid ${c.cor}` }}
    >
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h5 className="mb-0">{c.nome}</h5>

        <Badge bg="dark">
          Nível {c.nivel}
        </Badge>
      </div>

      <p className="mb-3">
        {c.tempoMaxMin !== null
          ? `Atendimento em até ${c.tempoMaxMin} minutos.`
          : `Tempo de referência: ${c.tempoReferenciaMin} minutos, sem limite rígido.`}
      </p>

      {c.explicacao.length > 0 && (
        <ListGroup variant="flush" className="mb-3">
          {c.explicacao.map((e, i) => (
            <ListGroup.Item key={i}>
              {e}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {c.alertas.map((a) => (
        <Alert key={a.id} variant="warning" className="py-2 mb-2">
          <strong>Atenção:</strong> {a.texto}
          <div className="small mt-1">
            Fonte: {a.fonte}
          </div>
        </Alert>
      ))}

      {c.camposAusentes.length > 0 && (
        <Alert variant="secondary" className="mb-0">
          <strong>Sinais não informados:</strong>{' '}
          {c.camposAusentes.join(', ')}
        </Alert>
      )}
    </Alert>
  );
}
