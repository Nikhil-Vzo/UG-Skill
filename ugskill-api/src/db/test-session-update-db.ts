import { updatePlacementSessionStatus } from '../modules/placement/placement.service';

async function main() {
  try {
    const id = 'cf62a22d-ebd3-4d66-ad32-178dc1c787b5';
    console.log('Attempting to update placement session status to in_progress...');
    const result = await updatePlacementSessionStatus(id, { status: 'in_progress' });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error during updatePlacementSessionStatus:', err);
  }
  process.exit(0);
}

main();
