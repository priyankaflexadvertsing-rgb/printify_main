import { notifficationBaseDir } from "../../config/fileConfing.js";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";

export const file_Path = (name) => path.join(notifficationBaseDir, `${name}.json`);

class NotificationServices {
    static async createNotifficationFile(payload) {
        const { userId, tittle, message } = payload;
        if (!tittle || !message) {
            console.log("need tittle, message");
        }

        const filePath = file_Path(userId);
        const data = {
            status:"unread",
            userId: userId,
            tittle: tittle,
            message: message,
            CrateDate: new Date().toISOString(),
        }

        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return data
        } catch (err) {
            return err.message
        }

    }


    static async getAllNotiffication() {
        const userFiles = [];

        try {
            // Read all files/directories in baseDir
            const files = await fsPromises.readdir(notifficationBaseDir, { withFileTypes: true });


            for (const file of files) {
                // Only process .json files
                if (file.isFile() && file.name.endsWith(".json")) {
                    const filePath = path.join(notifficationBaseDir, file.name);

                    try {
                        const content = await fsPromises.readFile(filePath, "utf-8");
                        const jsonData = JSON.parse(content);
                        userFiles.push(jsonData);
                    } catch (parseError) {
                        console.error(`❌ Error parsing ${file.name}:`, parseError.message);
                    }
                }
            }
        } catch (err) {
            console.error("❌ Error reading user files:", err.message);
            return [];
        }

        return userFiles;
    }
}


export default NotificationServices;