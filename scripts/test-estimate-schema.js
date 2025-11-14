const fs = require('fs');
const path = require('path');

const openapi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'openapi.txt'), 'utf8'));
const {
  CreateEstimateSchema,
  UpdateEstimateSchema,
} = require('../dist/index.js');

const sampleValue = (info, name) => {
  const type = info.type || 'string';
  if (type === 'string') {
    if (name.toLowerCase().includes('date')) {
      return '2025-01-01T00:00:00Z';
    }
    if (name.toLowerCase().includes('bin')) {
      return 'BIN-1';
    }
    if (name.toLowerCase().includes('qty') || name.toLowerCase().includes('quantity')) {
      return '100';
    }
    return 'sample-text';
  }

  if (type === 'integer') {
    return 1;
  }

  if (type === 'number') {
    return 1.5;
  }

  if (type === 'boolean') {
    return true;
  }

  if (type === 'array') {
    if (name === 'materials') {
      return [{ subPartNumber: 'SUB-001' }];
    }
    if (name === 'routings') {
      return [{ stepNumber: 1 }];
    }
    return [];
  }

  return 'sample';
};

const buildSample = (props, overrides = {}) => {
  const sample = { ...overrides };
  for (const [key, info] of Object.entries(props)) {
    if (key in sample) {
      continue;
    }
    sample[key] = sampleValue(info, key);
  }
  return sample;
};

const estimateCreateProps = openapi.components.schemas.EstimateCreate.properties;
const estimateUpdateProps = openapi.components.schemas.EstimateUpdate.properties;

const createPayload = buildSample(estimateCreateProps, {
  partNumber: 'TEST-PART-0001',
});

const updatePayload = buildSample(estimateUpdateProps, {
  partNumber: 'TEST-PART-0001',
});

CreateEstimateSchema.parse(createPayload);
UpdateEstimateSchema.parse(updatePayload);

console.log('Estimate schema validation test passed.');
