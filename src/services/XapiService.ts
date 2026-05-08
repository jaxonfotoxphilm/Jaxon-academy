export interface XapiStatement {
    actor: {
        name: string;
        mbox?: string;
    };
    verb: {
        id: string;
        display: {
            "en-US": string;
        };
    };
    object: {
        id: string;
        definition: {
            name: {
                "en-US": string;
            };
        };
    };
    result?: {
        score?: {
            scaled?: number;
            raw?: number;
            min?: number;
            max?: number;
        };
        success?: boolean;
        completion?: boolean;
        response?: string;
    };
}

export class XapiService {
    /**
     * Simulates sending an xAPI statement to a Learning Record Store (LRS) or Supabase backend.
     */
    static async sendStatement(statement: XapiStatement): Promise<void> {
        console.log("xAPI Statement Logged:", JSON.stringify(statement, null, 2));
        
        // In a real application, this would POST to your LRS endpoint:
        // await fetch('https://lrs.example.com/xapi/statements', { ... })
    }

    static verbs = {
        completed: {
            id: "http://adlnet.gov/expapi/verbs/completed",
            display: { "en-US": "completed" }
        },
        attempted: {
            id: "http://adlnet.gov/expapi/verbs/attempted",
            display: { "en-US": "attempted" }
        },
        answered: {
            id: "http://adlnet.gov/expapi/verbs/answered",
            display: { "en-US": "answered" }
        },
        read: {
            id: "http://activitystrea.ms/schema/1.0/read",
            display: { "en-US": "read" }
        }
    };
}
