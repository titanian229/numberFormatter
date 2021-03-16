const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(__dirname, 'backups');
// const outputPath = path.join(OUTPUT_DIR, "output.html");

const locationChecker = (location) => {
    //Check it's an HTML file, and check it's a valid path
    return true;
};

async function mainApp() {
    console.log(
        "Welcome to the Number Formatter.\n\nIf this is your first time using it please note:\nThis will backup the file to the backups directory within this repo, and overwrite the HTML file you've named.\nIt will also confirm line by line each correction, press enter to confirm and type any characters and press enter to skip.\n\nPress Control-C at any point to exit.\n\n"
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

    let fileLocation = menuAction.fileLocation
    fileLocation = fileLocation.replace(/\"/g, '') //removes quotation marks
    // let fileLocation = 'C:\\MAMP\\htdocs\\baf3m_html\\lessons\\baf3m_u2la6.html';

    fileLocation = path.normalize(fileLocation);
    let fileContents = fs.readFileSync(fileLocation, 'utf8');
    //WRITE THE BACKUP
    
    
    
    fileContents = fileContents.split(/\r?\n/);
    
    newFileContents = [];

    let enteredHTMLBody = false;

    for (let j = 0; j < fileContents.length; j++) {
        const line = fileContents[j];
        //Checking if not yet inside the body tag
        if (line.includes('<body>')) {
            enteredHTMLBody = true;
        }
        if (line.includes('</body>')) {
            enteredHTMLBody = false;
        }

        if (!enteredHTMLBody) {
            newFileContents.push(line);
            continue;
        }

        let replacementLine = line;

        //Anti patterns for BAF3M
        if (line.toLowerCase().includes('invoice')){
            newFileContents.push(line);
            continue
        }

        if (line.search(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g) !== -1) {
            //note SIMPLIFY THAT REGEX, THIS IS FOR TESTING
            console.log(line.trim());
            // const matches = Array.from(line.matchAll(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g));


            const matches = line.match(/(\d{4,})|(\d+ \d{3} \d{3})|(\d+ \d{3})/g);

            for (let index = 0; index < matches.length; index++) {
                const match = matches[index];
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

    // Final confirmation
    const finalConfirm = await inquirer.prompt({
                type: 'confirm',
                name: 'confirmation',
                message:
                    'Confirm overwriting your file?',
            })

    if (!finalConfirm.confirmation){
        return
    }

    //Writing backup
    fs.writeFileSync(path.join(BACKUP_DIR, path.parse(fileLocation).name + '.html'), fileContents.join('\n\r'));
    
    fs.writeFileSync(fileLocation, newFileContents.join('\n'));

    console.log("IT HAS BEEN DONE.")
    
    


}


mainApp();
