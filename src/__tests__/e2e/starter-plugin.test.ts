import { v4 as uuidv4 } from 'uuid';

/**
 * ZABAL Plugin E2E Test Suite
 *
 * Tests run in a real runtime environment provided by `elizaos test`.
 */

interface TestSuite {
  name: string;
  description: string;
  tests: Array<{
    name: string;
    fn: (runtime: any) => Promise<any>;
  }>;
}

type UUID = `${string}-${string}-${string}-${string}-${string}`;

interface Memory {
  entityId: UUID;
  roomId: UUID;
  content: {
    text: string;
    source: string;
    actions?: string[];
  };
}

interface State {
  values: Record<string, any>;
  data: Record<string, any>;
  text: string;
}

interface Content {
  text: string;
  source?: string;
  actions?: string[];
}

export class ZabalTestSuite implements TestSuite {
  name = 'zabal';
  description = 'E2E tests for the ZABAL coordination intelligence agent';

  tests = [
    {
      name: 'Character configuration test',
      fn: async (runtime: any) => {
        const character = runtime.character;
        const requiredFields = ['name', 'bio', 'plugins', 'system', 'messageExamples'];
        const missingFields = requiredFields.filter((field) => !(field in character));

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (character.name !== 'ZABAL') {
          throw new Error(`Expected character name to be 'ZABAL', got '${character.name}'`);
        }
        if (!character.system.includes('coordination intelligence')) {
          throw new Error('Character system prompt should mention coordination intelligence');
        }
      },
    },

    {
      name: 'Plugin initialization test',
      fn: async (runtime: any) => {
        try {
          await runtime.registerPlugin({
            name: 'zabal',
            description: 'ZABAL ecosystem plugin',
            init: async () => {},
            config: {},
          });
        } catch (error) {
          throw new Error(`Failed to register plugin: ${(error as Error).message}`);
        }
      },
    },

    {
      name: 'TOKEN_INFO action test',
      fn: async (runtime: any) => {
        const message: Memory = {
          entityId: uuidv4() as UUID,
          roomId: uuidv4() as UUID,
          content: {
            text: "What's the ZABAL token price?",
            source: 'test',
            actions: ['TOKEN_INFO'],
          },
        };

        const state: State = { values: {}, data: {}, text: '' };
        let responseReceived = false;

        const tokenInfoAction = runtime.actions?.find((a: any) => a.name === 'TOKEN_INFO');
        if (!tokenInfoAction) {
          throw new Error('TOKEN_INFO action not found in runtime.actions');
        }

        await tokenInfoAction.handler(
          runtime,
          message,
          state,
          {},
          async (content: Content) => {
            if (content.text && content.actions?.includes('TOKEN_INFO')) {
              responseReceived = true;
            }
            return [];
          },
          []
        );

        if (!responseReceived) {
          throw new Error('TOKEN_INFO action did not produce expected response');
        }
      },
    },

    {
      name: 'Provider functionality test',
      fn: async (runtime: any) => {
        const message: Memory = {
          entityId: uuidv4() as UUID,
          roomId: uuidv4() as UUID,
          content: { text: 'test', source: 'test' },
        };

        const state: State = { values: {}, data: {}, text: '' };

        if (!runtime.providers || runtime.providers.length === 0) {
          throw new Error('No providers found in runtime');
        }

        const activityProvider = runtime.providers.find(
          (p: any) => p.name === 'ACTIVITY_CONTEXT_PROVIDER'
        );

        if (!activityProvider) {
          throw new Error('ACTIVITY_CONTEXT_PROVIDER not found');
        }

        const result = await activityProvider.get(runtime, message, state);
        // Should not throw — returns empty text when no activity
        if (result === undefined || result === null) {
          throw new Error('Provider returned null/undefined');
        }
      },
    },

    {
      name: 'SlashCommandService test',
      fn: async (runtime: any) => {
        const service = runtime.getService('zabal-commands');
        if (!service) {
          // Service may not start without Discord — that's OK in test env
          console.log('Note: zabal-commands service not available (no Discord in test env)');
          return;
        }

        if (!service.capabilityDescription) {
          throw new Error('Service missing capabilityDescription');
        }
      },
    },
  ];
}

export default new ZabalTestSuite();
