import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { exiftool } from "exiftool-vendored";

import { baseDir, compressed_printing_files } from "../../../config/fileConfing.js";
import ReadDirRecursive, { generateThumbnail, normalizeFileName } from "./readdirrecursive.js";
import PaymentsService from "../payments/calculateUserAmount.js";


export const file_Path = (name) => path.join(baseDir, `${name}.json`);

class FilesService {
  static async createUserFile(payload) {
    const { userId, name, email, password, printing, rate, excelfiles } = payload;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Customer name is required." });
    }
    const trinmedName = name.trim();
    const filePath = file_Path(trinmedName);

    const data = {
      userId: userId,
      role: "user",
      name: name,
      email: email,
      password: password,
      printing: printing,
      excelfiles: excelfiles,
      rate: rate,
      CrateDate: new Date().toISOString(),
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return data
    } catch (err) {
      return err.message
    }

  }

  static async compressImagesFiles(inputFilePath) {
    try {
      if (!fs.existsSync(inputFilePath)) {
        throw new Error(`File does not exist: ${inputFilePath}`);
      }

      const ext = path.extname(inputFilePath).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".tif", ".tiff"].includes(ext)) {
        throw new Error("Unsupported file type for compression");
      }

      const parsed = path.parse(inputFilePath);

      // Normalize file name
      const cleanName = normalizeFileName(parsed.name) + ".jpg";

      // Output directory + file
      const outputPath = path.join(
        compressed_printing_files,
        cleanName
      );

      // If file already compressed → skip
      if (fs.existsSync(outputPath)) {
        console.log(`⚡ Skipping compression (already exists): ${outputPath}`);
        return outputPath;
      }

      // Generate thumbnail / compression
      await generateThumbnail(inputFilePath, outputPath);

      await exiftool.end();

      return outputPath;

    } catch (err) {
      console.error("❌ Compression failed:", err);
      throw err;
    }
  }


  static async getUserFileByEmail(payload) {
    const { email } = payload;

    try {
      const files = fs.readdirSync(baseDir, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".json")) {
          const filePath = path.join(baseDir, file.name);
          const content = fs.readFileSync(filePath, "utf-8");

          try {
            const jsonData = JSON.parse(content);


            if (jsonData.email === email) {
              return jsonData;
            }
          } catch (parseError) {
            console.error(`Error parsing ${file.name}:`, parseError);
          }
        }
      }

      // If no file matches the email
      return null;

    } catch (err) {
      console.error("Error reading user files:", err);
      return null;
    }
  }

  static async getUserFileById(payload) {
    const { userId } = payload;




    try {
      const files = fs.readdirSync(baseDir, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".json")) {
          const filePath = path.join(baseDir, file.name);
          const content = fs.readFileSync(filePath, "utf-8");

          try {
            const jsonData = JSON.parse(content);


            if (jsonData.userId === userId) {
              return jsonData;
            }
          } catch (parseError) {
            console.error(`Error parsing ${file.name}:`, parseError);
          }
        }
      }

      // If no file matches the email
      return null;

    } catch (err) {
      console.error("Error reading user files:", err);
      return null;
    }
  }

  static async getAllUsersFiles() {
    const userFiles = [];

    try {
      // Read all files/directories in baseDir
      const files = await fsPromises.readdir(baseDir, { withFileTypes: true });


      for (const file of files) {
        // Only process .json files
        if (file.isFile() && file.name.endsWith(".json")) {
          const filePath = path.join(baseDir, file.name);

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

  static async updateUserFile(payload) {
    const { name } = payload;
    const trinmedName = name.trim();
    const filePath = file_Path(trinmedName);


    try {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));


      return payload
    } catch (err) {
      return err.message
    }
  }

  static async getAllPrintingFiles() {
    const files = ReadDirRecursive.readDirectoryRecursive(compressed_printing_files);
    return files;
  }


  static async deletePrintingInUserFile(payload, pid) {


    const { id } = payload;
    const { printingId } = pid


    // 1️⃣ Load user file
    const userFile = await FilesService.getUserFileById({ userId: id });
    if (!userFile) throw new Error("User not found");

    // Ensure printing array exists
    if (!Array.isArray(userFile.printing)) {
      userFile.printing = [];
    }

    // 2️⃣ Find the printing entry
    const fileIndex = userFile.printing.findIndex(
      (p) => p._id.toString() === printingId
    );




    if (fileIndex === -1) {
      throw new Error("File not found");
    }

    const fileToDelete = userFile.printing[fileIndex];

    // 3️⃣ Delete files from disk (safely)
    try {
      if (fileToDelete.originalfilePath && fs.existsSync(fileToDelete.originalfilePath)) {
        fs.unlinkSync(fileToDelete.originalfilePath);
      }
      if (fileToDelete.compressedfilePath && fs.existsSync(fileToDelete.compressedfilePath)) {
        fs.unlinkSync(fileToDelete.compressedfilePath);
      }
    } catch (err) {
      console.error("⚠ Error deleting files:", err);
    }

    // 4️⃣ Remove entry from printing array
    userFile.printing.splice(fileIndex, 1);

    // 5️⃣ Save updated user file
    const updatedUser = await FilesService.updateUserFile(userFile);

    return {
      success: true,
      message: "File deleted successfully",
      user: updatedUser,
    };
  }


  static async editPrintingInUserFile(payload, pid, updatedFields) {
    const { id } = payload;
    const { printingId } = pid;

    const userFile = await FilesService.getUserFileById({ userId: id });
    if (!userFile) throw new Error("User not found");

    if (!Array.isArray(userFile.printing)) {
      userFile.printing = [];
    }

    // Find the entry
    const index = userFile.printing.findIndex(
      (p) => p._id.toString() === printingId
    );

    if (index === -1) throw new Error("File not found");

    // Update only the fields sent by frontend
    Object.keys(updatedFields).forEach((key) => {
      userFile.printing[index].payment_details.items[key] = updatedFields[key];

    });



    // Save changes
    const updatedUser = await FilesService.updateUserFile(userFile);

    return {
      success: true,
      message: "File updated successfully",
      user: updatedUser,
    };
  }

  static async updateUserRate(payload, rates) {
    const { id } = payload; // user ID
    const { rate } = rates; // rate object sent from frontend


    try {
      // 1️⃣ Load the user file
      const userFile = await FilesService.getUserFileById({ userId: id });
      if (!userFile) {
        return { success: false, message: "User not found" };
      }

      // 2️⃣ Update the rate field only
      if (!userFile.rate || typeof userFile.rate !== "object") {
        userFile.rate = {};
      }

      Object.keys(rate).forEach((key) => {

        userFile.rate[key] = rate[key];
      });


      // 3️⃣ Save changes to disk
      const updatedUser = await FilesService.updateUserFile(userFile);


      // 4️⃣ Return updated user
      return {
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      };
    } catch (err) {
      console.error("Error updating user file:", err);
      return { success: false, message: "Server error", error: err.message };
    }
  }


}
export default FilesService;