const db = require('../config/database');

// List all teachers (Corrected query to remove users.status)
exports.listTeachers = (req, res) => {
    db.all(`
        SELECT teachers.*, users.username 
        FROM teachers 
        LEFT JOIN users ON teachers.user_id = users.id 
        ORDER BY teachers.id DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('[DATABASE ERROR]:', err.message);
            return res.status(500).send("Database error occurred: " + err.message);
        }
        res.render('teachers/list', { teachers: rows, user: req.session });
    });
};

// Show Add Teacher Form
exports.showAddForm = (req, res) => {
    res.render('teachers/register', { error: null, user: req.session });
};

// Handle Teacher Registration (creates Staff profile + User account)
exports.registerTeacher = (req, res) => {
    const { fullname, gender, qualification, specialty, username } = req.body;
    const defaultPassword = 'teacher123'; // Default secure password for teachers

    // Begin a serialized transaction to ensure both writes succeed or fail together
    db.serialize(() => {
        // 1. Create Login User Account
        db.run(
            "INSERT INTO users (username, password, role) VALUES (?, ?, 'teacher')",
            [username, defaultPassword],
            function(err) {
                if (err) {
                    return res.render('teachers/register', { 
                        error: 'Username is already taken.', 
                        user: req.session 
                    });
                }
                const newUserId = this.lastID;

                // 2. Generate Staff ID automatically (e.g., SAJ/STAFF/001)
                db.get("SELECT COUNT(*) as count FROM teachers", [], (errCount, row) => {
                    const nextNum = (row.count + 1).toString().padStart(3, '0');
                    const calculatedStaffId = `SAJ/STAFF/${nextNum}`;

                    // 3. Create Teacher Profile record
                    db.run(
                        `INSERT INTO teachers (staff_id, fullname, gender, qualification, subject_specialty, user_id) 
                         VALUES (?, ?, ?, ?, ?, ? )`,
                        [calculatedStaffId, fullname, gender, qualification, specialty, newUserId],
                        (insertErr) => {
                            if (insertErr) {
                                // Rollback user account if profile insertion fails
                                db.run("DELETE FROM users WHERE id = ?", [newUserId]);
                                return res.render('teachers/register', { 
                                    error: 'Failed to create teacher profile.', 
                                    user: req.session 
                                });
                            }
                            res.redirect('/teachers');
                        }
                    );
                });
            }
        );
    });
};

// Delete teacher and their linked login account
exports.deleteTeacher = (req, res) => {
    const { id } = req.params;
    db.get("SELECT user_id FROM teachers WHERE id = ?", [id], (err, teacher) => {
        if (teacher) {
            db.serialize(() => {
                db.run("DELETE FROM users WHERE id = ?", [teacher.user_id]);
                db.run("DELETE FROM teachers WHERE id = ?", [id], () => {
                    res.redirect('/teachers');
                });
            });
        } else {
            res.redirect('/teachers');
        }
    });
};
