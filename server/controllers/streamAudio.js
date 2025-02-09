const streamAudio = (req, res) => {

    const { filename } = req.params;

    let filePath = null;
    if(filename.includes('speech1')) {
        filePath = path.join(__dirname, '..', 'audio', 'uyVNoMrnUku1dZyVEXwD', filename);
    } else if (filename.includes('speech2')) {
        filePath = path.join(__dirname, '..', 'audio', 'PDoCXqBQFGsvfO0hNkEs', filename);
    }

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.sendFile(filePath);
    } else {
        console.log("File does not exist:", filePath);
        return res.status(404).json({ error: 'Audio file not found.' });
    }

}

module.exports = streamAudio;