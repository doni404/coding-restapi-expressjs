import bcrypt from 'bcrypt'
import dayjs from 'dayjs'
import 'dayjs/locale/ja.js'

export function generateFilename(format) {
    let ran = Math.floor((Math.random() * 300))
    let imageName = moment().format("YYYYMMDD-HHmmss") + "-" + ran + "." + format
    return imageName
}

export function getDateString() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = String(today.getFullYear()).slice(-2);
    return mm + '/' + dd + '/' + yyyy;
}

export function getQueryParamsFormat(params) {
    let dataParams = "";

    let length = Object.keys(params).length;
    let count = 0;

    for (var key of Object.keys(params)) {
        dataParams += key + ":'" + params[key] + "'";
        count++;
        if (count != length) {
            dataParams += " AND "
        }
    }
    return dataParams
}

export function containsEmptyStringForSpecificProps(propsToCheck, obj) {
    /** 
     * Example of propsToCheck value
     * propsToCheck = ['email', 'name']
     */

    return propsToCheck.some(prop =>
        obj.hasOwnProperty(prop) && (obj[prop] === '' || (typeof obj[prop] === 'string' && obj[prop].trim() === ''))
    )
}

export function objectToQueryString(obj) {
    return Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&')
}

export function queryStringToObject(queryString) {
    return queryString.split('&').reduce((acc, part) => {
        const [key, value] = part.split('=').map(decodeURIComponent)
        acc[key] = value
        return acc
    }, {})
}

export function comparePassword(param1, param2) {
    return new Promise(function (resolve, reject) {
        bcrypt.compare(param1, param2, function (err, res) {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}

export function hasAllowedKeysOnly(obj, allowedKeys) {
    // Get all keys on object
    const keys = Object.keys(obj)

    for (let key of keys) {
        if (!allowedKeys.includes(key)) {
            return false // this key is not allowed
        }
    }
    return true
}

export function containsRequiredKeys(obj, requiredKeys) {
    // Chek if all keys in requiredKeys exist on obj
    for (let key of requiredKeys) {
        if (!obj.hasOwnProperty(key)) {
            return false; // a required key from requiredKeys is missing in obj
        }
    }
    return true;
}

export function convertLinkTag(url) {
    return url.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')
}

export function convertEmailTag(email) {
    return email.replace(/(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g, '<a href="mailto:$1">$1</a>');
}

export function titleToURL(title) {
    return title
        .toLowerCase()                       // Convert to lowercase
        .replace(/[^a-z0-9\s-]/g, '')         // Remove non-alphanumeric characters except spaces
        .trim()                              // Remove leading and trailing spaces
        .replace(/\s+/g, '-')                // Replace spaces with dashes
        .replace(/-+/g, '-');                // Replace consecutive dashes with a single dash
}

export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

export function stringToDate(inputString) {
    // Cek apakah string tersebut berformat ISO 8601 (e.g., "2023-10-27T06:10:08.563Z")
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(inputString)) {
        return new Date(inputString);
    }

    // Cek apakah string tersebut berformat "YYYY-MM-DD HH:MM:SS"
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(inputString)) {
        const [datePart, timePart] = inputString.split(' ');

        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);

        // Ingat, bulan di JavaScript diindeks dari 0-11, sehingga kita perlu mengurangkan 1 dari bulan.
        return new Date(year, month - 1, day, hour, minute, second);
    }

    throw new Error('Invalid date format.');
}

export function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }

    return result;
}

// Example
// console.log(generateRandomStringComplex(16, 'aA'));
// console.log(generateRandomStringComplex(32, '#aA'));
// console.log(generateRandomStringComplex(64, '#A!'));
export function generateRandomStringComplex(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}

export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function capitalizeWords(str) {
    return str.split(' ') // Memisahkan string menjadi array berdasarkan spasi
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Mengubah huruf pertama setiap kata menjadi huruf kapital
        .join(' '); // Menggabungkan array menjadi string kembali dengan spasi sebagai pemisah
}

export function formatDateJapaneseFromString(inputDate) {
    // Parse the date string and set the locale to Japanese
    const date = dayjs(inputDate).locale('ja')

    // Format the date in the desired format
    // YYYY年MM月DD日
    return date.format('YYYY年MM月DD日')
}

export function formatReservationDateJapaneseFromString(reservationDate) {
    // Parse the date string and set the locale to Japanese
    const date = dayjs(reservationDate).locale('ja')

    // Format the date in the desired format
    // YYYY年MM月DD日（ddd）HH:mm
    return date.format('YYYY年MM月DD日(ddd)HH:mm') + '〜'
}

export function isJSON(str) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

export function textToFullWidth(str) {
    return str.split('').map(char => {
        const code = char.charCodeAt(0)
        return (code >= 33 && code <= 126) ? String.fromCharCode(code + 65248) : char
    }).join('')
}

export function textToHalfWidth(str) {
    return str.split('').map(char => {
        const code = char.charCodeAt(0)
        // For general full-width Latin characters (excluding Kana)
        if (code >= 65281 && code <= 65374) {
            return String.fromCharCode(code - 65248)
        }
        // Specific conversions for Kana or other characters can be added here
        return char
    }).join('')
}

export function isValidDate(dateString) {
    const date = new Date(dateString)
    return !isNaN(date)
}

export function isInteger(value) {
    const number = Number(value)
    return Number.isInteger(number)
}

export function isArray(variable) {
    return Array.isArray(variable)
}