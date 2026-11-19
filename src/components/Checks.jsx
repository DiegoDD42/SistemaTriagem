
import { Form, Row, Col } from 'react-bootstrap';

export default function Checks({ itens, marcados, onToggle }) {
  return (
    <Row className="g-2">
      {itens.map(([id, rotulo]) => (
        <Col xs={12} sm={6} key={id}>
          <Form.Check
            type="checkbox"
            id={`check-${id}`}
            label={rotulo}
            checked={marcados.includes(id)}
            onChange={() => onToggle(id)}
            className="check-item"
          />
        </Col>
      ))}
    </Row>
  );
}
