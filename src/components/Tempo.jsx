
import { Badge } from 'react-bootstrap';

export default function Tempo({ c }) {
  return c.tempoMaxMin !== null ? (
    <Badge bg="light" text="dark" className="tempo-badge">
      Limite: {c.tempoMaxMin} min
    </Badge>
  ) : (
    <Badge bg="light" text="dark" className="tempo-badge">
      Referência: {c.tempoReferenciaMin} min
    </Badge>
  );
}
