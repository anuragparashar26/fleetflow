import { syncUser as syncUserService, getMe as getMeService } from "../services/auth.service.js"

export const syncUser = async (req, res, next) => {
    try {
        const result = await syncUserService(req)
        res.json(result)
    } catch (err) {
        next(err)
    }
}

export const getMe = async (req, res, next) => {
    try {
        const result = await getMeService(req.user.id);
        res.json(result)
    } catch (err) {
        next(err)
    }
}