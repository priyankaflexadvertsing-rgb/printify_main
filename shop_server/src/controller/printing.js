import UserService from "../service/web/user/user.js";
import FilesService from "../service/web/user/file.js";


export const uploadPrinting = async (req, res) => {

    const dd = await UserService.updateUserFile(req.user, req.files);

    if (dd) {
        return res.status(200).json({ message: `File uploaded successfully`, data: dd });
    } else {
        return res.status(500).json({ message: `error is uploading file` });
    }

};


export const getAllPrinting = async (req, res) => {
    const dd = await FilesService.getAllPrintingFiles();

    if (dd) {
        return res.status(200).json({ message: `Files`, data: dd });
    } else {
        return res.status(500).json({ message: `error is uploading file` });
    }
}


export const deletePrintingInUserFile = async (req, res) => {
    try {
        const dd = await FilesService.deletePrintingInUserFile(req.user, req.params)

        res.json(dd);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
}

export const editPrintingInUserFile = async (req, res) => {
    try {
        const result = await FilesService.editPrintingInUserFile(req.user, req.params, req.body);

        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}


export const userDetailsUpate = async (req, res) => {
    


    try {
        const result = await FilesService.updateUserRate(req.user, req.body);

        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}