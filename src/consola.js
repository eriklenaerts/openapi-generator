import chalk from "chalk";

export default class consola {
    tabsUsedInChain;

    static log(message) {
        console.log(message);
        return this;
    }

    static sub(message) {
        console.log(chalk.dim.italic(message));
        return this;
    }

    static error(message) {
        console.error('%s\t%s', chalk.red.bold('ERROR'), chalk.red(message));
        return this;
    }

    static start(message) {
        console.log('%s\t%s', chalk.green.bold('START'), message);
        return this;
    }

    static warn(message) {
        console.log('%s\t%s', chalk.yellow.bold('WARN'), message);
        return this;
    }
    static trace(message, isTraceActive) {
        if (isTraceActive)
            console.log('%s\t%s', chalk.yellow.bold('TRACE'), message);
        return this;
    }

    static done(message) {
        console.log('%s\t%s', chalk.green.bold('DONE'), message);
        return this;
    }

    static tip(message) {
        console.log('%s\t%s', chalk.blue.bold('TIP'), message);
        return this;
    }

    static title(message) {
        console.log('%s', chalk.whiteBright.bold(message));
        this.tab(this.tabsUsedInChain || 0)
        console.log(chalk.whiteBright.bold('-'.repeat(message.length)));
        this.tabsUsedInChain = 0;
        return this;
    }

    static subtitle(message) {
        console.log('%s', message);
        this.tab(this.tabsUsedInChain || 0)
        console.log('-'.repeat(message.length));
        this.tabsUsedInChain = 0;
        return this;
    }

    static newline() {
        console.log();
        return this;
    }

    static tab(times = 1) {
        if (times && times > 0) {
            process.stdout.write('\t'.repeat(times));
            this.tabsUsedInChain = times;
        }
        return this;
    }

}