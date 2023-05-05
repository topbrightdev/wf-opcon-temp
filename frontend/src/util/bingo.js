module.exports.getBingoLetterByNumber = (num) => {
    if (num > 0 && num <= 15) {
        return "B";
    } else if (num > 15 && num <= 30) {
        return "I";
    } else if (num > 30 && num <= 45) {
        return "N";
    } else if (num > 45 && num <= 60) {
        return "G";
    } else {
        return "O";
    }
}
