/**
 * Created by joseba.rodero.diaz on 09/03/18.
 */



const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

const net = require("net");

/**
 *Muestra la ayuda.
 */

exports.helpCmd = (socket, rl)  => {
    log(socket, "commandos");
    log(socket, " h|help - Muestra esta ayuda.");
    log(socket, " list - Listar los quizzes existentes.");
    log(socket, " show <id>  - Muestra la pregunta y la respuesta del quiz indicado");
    log(socket, " add -Añadir un nuevo quiz interactivamente.");
    log(socket, " delete <id> - Borrar el quiz indicado.");
    log(socket, " edit <id> - Editar el quiz indicado.");
    log(socket, " test <id> - Probar el quiz indicado.");
    log(socket, " p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "credits - Créditos.");
    log(socket, "q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = (socket, rl) => {

    // Nueva versión

    models.quiz.findAll()  //Promesa
        .each(quiz =>  {
                log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })

    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });





};



const validateId = id => {

    return new Sequelize.Promise ((resolve, reject) => {
        if (typeof id === "undefined") {
            reject (new Error (`Falta el parametro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};





exports.showCmd = (socket,rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
    throw new Error(`No existe un quiz asiciado al id=${id}.` );
        }
        log(socket, `[${colorize(quiz.id, 'magenta')}]:  ${quiz.question}  ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })

    .catch(error => {
        errorlog(socket, error.mesage);
    })
    .then(() => {
        rl.prompt();
    });

};





const makeQuestion = ( rl,text) => {
    return new Sequelize.Promise((resolve,reject) => {
        rl.question(colorize(text, 'red'), answer => {
        resolve(answer.trim());
});
});
};


exports.addCmd = (socket,rl) => {
    makeQuestion(socket, rl, 'Introduzca una pregunta: ')
        .then(q => {
        return makeQuestion(socket, rl, ' Introduzca la respuesta: ')
            .then(a => {
            return {question: q, answer: a};
});
})
.then(quiz => {
        return models.quiz.create(quiz);
})
.then((quiz) => {
        log(socket, `${colorize('Se ha aÃ±adido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(socket, message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});

};




exports.deleteCmd = (socket, rl, id) => {

validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });

};


exports.editCmd = (socket, rl, id) => {

validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl, 'Introduzca la pregunta: ')
            .then(q => {
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                return makeQuestion(rl, ' Introduzca la respuesta: ')
                    .then(a => {
                        quiz.question = q;
                        quiz.answer = a;
                        return quiz;
                });
        });

    })

    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por : ${quiz.question} ${colorize('=>', 'magenta')}`);
    })

    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erróneo: ');
        error.errors.forEach(({message}) => errorlog(message));
    })
.catch(error => {
        errorlog(socket, error.message);
    })

    .then(() => {

rl.prompt();

    });

};




exports.testCmd = (socket,rl,id) => {
    validateId(id) //primero tenemos que validar el usuario
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(!quiz){
        throw new Error(`No hay un quiz asociado a ese id=${id}.`);
    }
    return makeQuestion(rl, `${quiz.question}?: `) //Hacemos la pregunta que queremos testear
        .then(respuesta => { //guardo la respuesta que he escrito en la pantalla, de la pregunta que hemos elegido nosotros
        if((respuesta.toLowerCase()) === ((quiz.answer).toLowerCase().trim())) {
        log(socket,'Respuesta correcta', 'green');
    } else {
        log(socket,'Respuesta Incorrecta', 'red')
    }
})
})
.catch(Sequelize.ValidationError, error => { //Si hay errores de validación
        errorlog(socket,'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(() => {
        rl.prompt();
});

};


exports.playCmd = (socket,rl) => {
    let score = 0;
    let toBePlayed = [];

    const playOne = () => {

        return Promise.resolve()
            .then (() => {
            if (toBePlayed.length <= 0) {
            console.log(socket,"No quedan más preguntas se ha acabado el juegos");
            return;
        }
        let pos = Math.floor(Math.random() * toBePlayed.length);
        let quiz = toBePlayed[pos];
        toBePlayed.splice(pos, 1);

        return makeQuestion(rl, `${quiz.question}:`) //
            .then(respuesta => {
            if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
            score++;
            log(socket,'Resuesta correcta', 'green');
            return playOne();
        } else {
            log(socket,'Respuesta incorrecta', 'red');
            log(socket,"Fin del juego");
        }
    })
    })
    }

    models.quiz.findAll({raw: true}) //para comprobar que no te repita una pregunta que ya habías acertado antes
        .then(quizzes => {
        toBePlayed = quizzes;
})
.then(() => {
        return playOne();
})
.catch(e => {
        console.log(socket,"error: " + e);
})
.then(() => {
        console.log(socket,`Tu puntuación actual es:${score}`);
    rl.prompt();
})
};



    exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autores de la práctica:');
    log(socket, 'Joseba Rodero', 'green');
    rl.prompt();
};

exports.quitCmd = (socket, rl) => {
    rl.close();
    rl.prompt();
    socket.end();
};



