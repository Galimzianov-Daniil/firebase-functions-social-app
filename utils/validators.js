const isEmpty = str => str.trim() === "";
const isEmail = str => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return str.match(emailRegEx)
}

const validateAs = (data, dataType = "" ) => {

    let errors = {};

    if (data.email) {
        if (isEmpty(data.email)) errors.email = "Must not be empty";
        if (!isEmail(data.email)) errors.email = "Invalid email address";
    } else errors.email = "Required field";

    if (data.password) {
        if (isEmpty(data.password)) errors.password = "Must not be empty";
    } else errors.password = "Required field";

    if (dataType === "signup") {
        if (data.confirmPassword) {
            if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";
        } else errors.confirmPassword = "Required field"

        if (data.handle) {
            if (isEmpty(data.handle)) errors.handle = "Must not be empty";
        } else errors.handle = "Required field"
    }

    return {
        errors,
        valid: !Boolean(Object.keys(errors).length)
    }

}

exports.reduceUserDetails = data => {
    const userDetails = {};
    const fields = ["bio", "website", "location"]

    fields.forEach(field => !isEmpty(data[field]) ? userDetails[field] = data[field] : null)

    return userDetails;
}

exports.validateSignupData = data => validateAs(data, "signup");
exports.validateLoginData = data => validateAs(data);
exports.isEmpty = isEmpty
exports.isEmail = isEmail