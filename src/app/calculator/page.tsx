import { BigBoard } from '@/components/terminal/BigBoard';
import { Panel } from '@/components/terminal/Panel';

export default function CalculatorPage() {
  return (
    <BigBoard
      parameters={<Panel title="CONFLICT PARAMETERS">placeholder</Panel>}
      theater={<Panel title="OPERATIONS THEATER">placeholder</Panel>}
      cost={<Panel title="COST ANALYSIS">placeholder</Panel>}
      humanToll={<Panel title="HUMAN TOLL">placeholder</Panel>}
      perPerson={<Panel title="PER PERSON">placeholder</Panel>}
      history={<Panel title="HISTORY">placeholder</Panel>}
    />
  );
}
