import * as dashboardService from '../services/dashboard.service.js';

export const getStudentDashboard = async (req, res) => {
    try {
        // Obtenemos ID del usuario (desde el token o hardcodeado si estás probando)
        const studentId = req.user.id; 

        // Delegamos TODA la responsabilidad al servicio
        const data = await dashboardService.getStudentDashboardData(studentId);

        res.json(data);

    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ message: "Error interno al procesar dashboard" });
    }
};