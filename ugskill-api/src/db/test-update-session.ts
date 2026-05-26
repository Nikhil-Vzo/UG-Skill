import { updatePlacementSessionStatusSchema } from '../modules/placement/placement.schemas';

async function main() {
  try {
    console.log('Testing schema validation with status only:');
    const body = { status: 'in_progress' };
    const parsed = updatePlacementSessionStatusSchema.safeParse({ body });
    console.log('Parsed result:', JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
