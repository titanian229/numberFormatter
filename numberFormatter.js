const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(__dirname, 'backups');

const locationChecker = (location) => {
    //Check it's an HTML file, and check it's a valid path
    let locationParsed;
    locationParsed = path.parse(path.normalize(location.replace(/\"/g, '')));

    if (locationParsed.ext.includes('.html')) {
        return true;
    } else {
        return false;
    }
};

async function mainApp() {
    console.log(
        "Welcome to the Number Formatter.\n\nIf this is your first time using it please note:\nThis will backup the file to the backups directory within this repo, and overwrite the HTML file you've named.\nIt will also confirm line by line each correction, press enter to confirm and type any characters and press enter to skip.\nIf you experience any bugs or have suggestions please email me (James Lee).\nPress Control-C at any point to exit.\n\n"
    );

    const menuAction = await inquirer.prompt([
        {
            type: 'input',
            name: 'fileLocation',
            message:
                'Please enter the location of the file you wish to parse:\nEx: "C:\\MAMP\\htdocs\\baf3m_html\\lessons\\baf3m_u2la6.html"\n',
            validate: function (inp) {
                return locationChecker(inp);
            },
        },
    ]);

    let fileLocation = menuAction.fileLocation;
    fileLocation = fileLocation.replace(/\"/g, ''); //removes quotation marks
    // let fileLocation = 'C:\\MAMP\\htdocs\\baf3m_html\\lessons\\baf3m_u2la6.html';

    fileLocation = path.normalize(fileLocation);
    let fileContents = fs.readFileSync(fileLocation, 'utf8');
    fileContents = fileContents.split(/\r?\n/);
    newFileContents = [];

    let enteredHTMLBody = false;
    let enteredSkipRegion = false;
    let foundMatch = false;

    for (let j = 0; j < fileContents.length; j++) {
        const line = fileContents[j];
        //Checking if not yet inside the body tag, to avoid parsing CSS rules
        if (line.toLowerCase().includes('<body')) {
            enteredHTMLBody = true;
        }
        if (line.toLowerCase().includes('</body')) {
            enteredHTMLBody = false;
        }

        if (!enteredHTMLBody) {
            newFileContents.push(line);
            continue;
        }
        //Skipped math/style sections, also skipping only a single line if the closing tag is present
        if (line.toLowerCase().includes('<math') || line.toLowerCase().includes('<style')) {
            if (line.toLowerCase().includes('</math') || line.toLowerCase().includes('</style')) {
                newFileContents.push(line);
                continue;
            }
            enteredSkipRegion = true;
        }
        if (line.toLowerCase().includes('</math') || line.toLowerCase().includes('</style')) {
            enteredSkipRegion = false;
        }

        if (enteredSkipRegion === true) {
            newFileContents.push(line);
            continue;
        }

        let replacementLine = line;

        //Anti patterns for BAF3M
        if (line.toLowerCase().includes('invoice') || line.toLowerCase().match(/cheque \d\d\d/g) !== null) {
            newFileContents.push(line);
            continue;
        }

        if (line.search(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g) !== -1) {
            //note SIMPLIFY THIS REGEX, THIS IS FOR TESTING
            console.log(j + 1, line.trim());
            // const matches = Array.from(line.matchAll(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g));

            const matches = line.match(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g);

            for (let index = 0; index < matches.length; index++) {
                const match = matches[index];
                if (!foundMatch) foundMatch = true;
                // CASE Number with spaces present, changing to nbsp
                let replacementNumber = match.replace(' ', '&nbsp;');
                // CASE Number without spaces, adding nbsp
                replacementNumber = replacementNumber.replace(/(\d)(?=(\d{3})+$)/g, '$1&nbsp;');
                const replacementConfirm = await inquirer.prompt({
                    type: 'input',
                    name: 'confirm',
                    message: `Enter to confirm, any letter then enter to skip\n ${match} -> ${replacementNumber}`,
                });
                if (replacementConfirm.confirm === '') {
                    replacementLine = replacementLine.replace(match, replacementNumber);
                }
            }
        }
        newFileContents.push(replacementLine);
    }

    //If no matches in entire file found
    if (!foundMatch) {
        console.log(
            "It looks like there are no numbers in need of formatting in your file, or they're hiding next to some antipatterns."
        );
        return;
    }

    // Final confirmation
    const finalConfirm = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmation',
        message: 'Confirm overwriting your file?',
    });

    if (!finalConfirm.confirmation) {
        return;
    }

    //Writing backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }
    fs.copyFileSync(fileLocation, path.join(BACKUP_DIR, path.parse(fileLocation).name + '.html'));
    // fs.writeFileSync(path.join(BACKUP_DIR, path.parse(fileLocation).name + '.html'), fileContents.join('\n\r'));

    fs.writeFileSync(fileLocation, newFileContents.join('\n'));

    console.log('IT HAS BEEN DONE.');
}

mainApp();
