import { registerTools, toolSchemaMap } from '../src/fastmcp/registerTools';
import * as schemas from '../src/schemas';
import { orderTools } from '../src/tools/orders';
import { customerTools } from '../src/tools/customers';
import { quoteTools } from '../src/tools/quotes';
import { inventoryTools } from '../src/tools/inventory';
import { productionTools } from '../src/tools/production';
import { employeeTools } from '../src/tools/employees';
import { generalTools } from '../src/tools/general';
import { generatedToolConfigs } from '../src/tools/generated';

const manualTools = [
    ...orderTools,
    ...customerTools,
    ...quoteTools,
    ...inventoryTools,
    ...productionTools,
    ...employeeTools,
    ...generalTools,
];

describe('FastMCP Tool Registration', () => {
    it('should have explicit schema mappings for all manual tools', () => {
        const missing = manualTools
            .map((tool) => tool.name)
            .filter((toolName) => !toolSchemaMap[toolName]);

        expect(missing).toEqual([]);
    });

    it('should map formerly permissive order and bundle schemas explicitly', () => {
        expect(toolSchemaMap.create_order_release).toBe(schemas.CreateOrderReleaseSchema);
        expect(toolSchemaMap.get_order_release_by_id).toBe(schemas.GetOrderReleaseByIdSchema);
        expect(toolSchemaMap.get_order_bundle).toBe(schemas.GetOrderBundleSchema);
        expect(toolSchemaMap.create_order_from_quote).toBe(schemas.CreateOrderFromQuoteSchema);
        expect(toolSchemaMap.get_po_bundle).toBe(schemas.GetPOBundleSchema);
        expect(toolSchemaMap.get_order_releases).toBe(schemas.GetOrderReleasesSchema);
        expect(toolSchemaMap.get_estimate_material_by_sub_part).toBe(schemas.GetEstimateMaterialBySubPartSchema);
    });

    it('should fail fast when a manual tool schema mapping is missing', () => {
        const originalSchema = toolSchemaMap.get_orders;
        const server = { addTool: jest.fn() };

        try {
            delete toolSchemaMap.get_orders;
            expect(() => registerTools(server as any, {} as any)).toThrow(
                'Missing schema mapping for manual tool: get_orders'
            );
        } finally {
            toolSchemaMap.get_orders = originalSchema;
        }
    });

    it('should register all manual and generated tools when mappings are complete', () => {
        const server = { addTool: jest.fn() };

        registerTools(server as any, {} as any);

        expect(server.addTool).toHaveBeenCalledTimes(manualTools.length + generatedToolConfigs.length);
    });
});
