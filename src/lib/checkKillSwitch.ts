import { db } from '../db/index.ts';
import { systemSettings } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export const isKillSwitchEnabled = async () => {
    try {
        const setting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'emergency_kill_switch'));
        if (setting.length > 0 && setting[0].value === true) {
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error checking kill switch:", e);
        return false;
    }
};
