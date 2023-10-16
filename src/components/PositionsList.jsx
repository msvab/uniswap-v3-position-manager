import { useState } from 'preact/hooks';
import { collectFees, getPositions } from '../logic/position-manager.js';

function Position({ position }) {
  const [collectionLoading, setCollectionLoading] = useState(false);

  const onCollectFees = async () => {
    setCollectionLoading(true);
    try {
      await collectFees(position);
    } catch (e) {
      alert(`Fees could not be collected ${e.details ? `: ${e.details}` : ''}`);
    }
    setCollectionLoading(false);
  };

  return (
    <tr>
      <td>
        {position.token0.symbol} / {position.token1.symbol}
      </td>
      <td>{position.positionId}</td>
      <td>
        <div class="fee-grid">
          <div>{position.token0.symbol}:</div>
          <div>{position.currentValue.valueFormatted0}</div>
          <div>{position.token1.symbol}:</div>
          <div>{position.currentValue.valueFormatted1}</div>
        </div>
      </td>
      <td>
        <div class="fee-grid">
          <div>{position.token0.symbol}:</div>
          <div>{position.feesFormatted0}</div>
          <div>{position.token1.symbol}:</div>
          <div>{position.feesFormatted1}</div>
        </div>
      </td>
      <td>
        <button disabled={collectionLoading} onClick={onCollectFees}>
          Collect Fees
        </button>
      </td>
    </tr>
  );
}
export function PositionsList() {
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positions, setPositions] = useState(undefined);

  const onLoadPositions = async () => {
    setPositionsLoading(true);
    try {
      setPositions(await getPositions());
    } catch (e) {
      console.error('Could not load positions', e);
    }
    setPositionsLoading(false);
  };

  return (
    <div>
      <div>
        <button disabled={positionsLoading} onClick={onLoadPositions}>
          Load Positions
        </button>
      </div>

      {positions?.length > 0 && !positionsLoading && (
        <table class="positions">
          <thead>
            <tr>
              <th>Position</th>
              <th>ID</th>
              <th>Value</th>
              <th>Collectible</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <Position position={position} />
            ))}
          </tbody>
        </table>
      )}

      {positions?.length === 0 && !positionsLoading && <p>No active positions.</p>}
    </div>
  );
}
