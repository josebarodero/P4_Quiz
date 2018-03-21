/**
 * Created by joseba.rodero.diaz on 28/02/18.
 */

const figlet = require('figlet');
const chalk = require('chalk');


// pinta mensajes

const colorize = (msg, color) => {

    if (typeof color !== "undefined") {
        msg = chalk[color].bold(msg);
    }
    return msg;
};





//Escribe un mensaje de log

const log = (socket, msg, color) => {

    socket.write(colorize(msg, color) + "\n");
};





//Escribe un mensaje de log en grande

const biglog = (socket, msg, color) => {

    log(socket, figlet.textSync(msg, { horizontalLayout: 'full'}), color);
};


//Escribe el mensaje de error emsg

const errorlog = (socket, esmg) => {

    socket.write(`${colorize("Error", "red")}: ${colorize(colorize(esmg , "red"), "bgYellowBright")}\n`);
};



exports = module.exports = {
    colorize,
    log,
    biglog,
    errorlog
};
