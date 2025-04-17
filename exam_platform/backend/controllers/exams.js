const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create a new exam
const createExam = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            targetYear, 
            targetField, 
            targetSemester, 
            targetGroup, 
            questions 
        } = req.body;

        // Generate a unique access link for the exam
        const accessLink = uuidv4();

        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert exam details
            const [examResult] = await connection.query(
                'INSERT INTO exams (title, description, target_year, target_field, target_semester, target_group, access_link) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, description, targetYear, targetField, targetSemester, targetGroup, accessLink]
            );

            const examId = examResult.insertId;

            // Insert questions
            for (const question of questions) {
                const { type, statement, options, correctAnswer, tolerance, points, duration } = question;

                const [questionResult] = await connection.query(
                    'INSERT INTO questions (exam_id, type, statement, options, correct_answer, tolerance, points, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [examId, type, statement, JSON.stringify(options), correctAnswer, tolerance, points, duration]
                );

                const questionId = questionResult.insertId;

                // Handle question options for MCQ
                if (type === 'mcq' && options) {
                    for (const option of options) {
                        await connection.query(
                            'INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                            [questionId, option.text, option.isCorrect]
                        );
                    }
                }

                // Handle direct question answers
                if (type === 'direct' && correctAnswer) {
                    await connection.query(
                        'INSERT INTO direct_answers (question_id, correct_answer, tolerance) VALUES (?, ?, ?)',
                        [questionId, correctAnswer, tolerance || 0]
                    );
                }
            }

            await connection.commit();
            connection.release();

            res.status(201).json({
                success: true,
                message: 'Exam created successfully',
                examId: examId,
                accessLink: accessLink
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create exam',
            error: error.message
        });
    }
};

// Get all exams (with optional filters)
const getExams = async (req, res) => {
    try {
        const { year, semester, group } = req.query;
        let query = 'SELECT * FROM exams WHERE 1=1';
        const params = [];

        if (year) {
            query += ' AND target_year = ?';
            params.push(year);
        }
        if (semester) {
            query += ' AND target_semester = ?';
            params.push(semester);
        }
        if (group) {
            query += ' AND target_group = ?';
            params.push(group);
        }

        const [exams] = await pool.query(query, params);
        res.json({ success: true, exams });

    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exams',
            error: error.message
        });
    }
};

// Get exam by ID with all questions and options
const getExamById = async (req, res) => {
    try {
        const examId = req.params.id;
        
        // Get exam details
        const [exams] = await pool.query('SELECT * FROM exams WHERE id = ?', [examId]);
        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const exam = exams[0];

        // Get questions
        const [questions] = await pool.query('SELECT * FROM questions WHERE exam_id = ?', [examId]);

        // Get options and answers for each question
        for (let question of questions) {
            if (question.question_type === 'mcq') {
                const [options] = await pool.query(
                    'SELECT * FROM question_options WHERE question_id = ?',
                    [question.id]
                );
                question.options = options;
            } else {
                const [answers] = await pool.query(
                    'SELECT * FROM direct_answers WHERE question_id = ?',
                    [question.id]
                );
                question.directAnswer = answers[0];
            }
        }

        exam.questions = questions;
        res.json({ success: true, exam });

    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exam',
            error: error.message
        });
    }
};

module.exports = {
    createExam,
    getExams,
    getExamById
};
