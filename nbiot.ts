/**
 * NB-IoT blocks
 */
//% weight=100 color=#1eadf8 icon="\uf1d8" block="NB-IoT"
namespace nbiot {
    const DEBUG = false
    let lines: string[] = []
    let socket = -1
    let serverIp = "172.16.15.14"
    let serverPort = 1234
    let awaitingResponse = false
    let _isConnected = false
    const connectCallbacks: (() => void)[] = []

    /**
     * Connect to the NB-IoT module
     * This involves opening a serial connection on chosen pins and connect to the
     * NB-IoT network.
     * @param rx The pin that is connected to RXD on EE-NBIOT-01, eg: SerialPin.P0
     * @param tx The pin that is connected to TXD on EE-NBIOT-01, eg: SerialPin.P1
     */
    //% blockId=nbiot_connect
    //% block="connect RX on %rx and TX on %tx"
    //% weight = 10
    export function connect(rx: SerialPin, tx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        basic.pause(1000)

        control.inBackground(() => {
            while (true) {
                readSerialData()
            }
        })

        drain()

        // the micro:bit spits out some garbage on the serial, so
        // send a dummy command that will fail
        serial.writeString("AT\r")
        basic.pause(100)
        reboot()

        // enable more detailed errors
        writeCommand("AT+CMEE=1")

        // trigger on connect callbacks
        control.inBackground(() => {
            while (checkConnection() != 1) {
                basic.pause(1000)
            }
            _isConnected = true

            connectCallbacks.forEach(cb => {
                cb()
                basic.pause(100)
            })
        })
    }

    /**
     * Configure server IP address and port. When sending strings or numbers,
     * it will be sent as an UPD message to this IP and port.
     * @param ip The IP address to send data, eg: "172.16.15.14"
     * @param port The port to send data, eg: 1234
     */
    //% blockId=nbiot_set_server
    //% block="set|server ip %ip port %port"
    //% port.min=0 port.max=65535
    //% weight = 20
    export function setServer(ip: string, port: number) {
        serverIp = ip
        serverPort = port
    }

    /**
     * Execute custom code when we get a connection to the network
     * @param code The custom code block(s) to run when we get a connection
     */
    //% blockId=nbiot_on_connected block="on nbiot connected"
    //% weight = 30
    export function onConnected(code: () => void): void {
        connectCallbacks.push(code)
    }

    /**
     * Send text or number as a string
     * @param str The text or number you want to send, eg: "Hello World!", 42
     */
    //% block
    //% str.shadowOptions.toString=true
    //% weight = 40
    export function sendString(str: string): void {
        const buf = pins.createBuffer(str.length)
        for (let i = 0; i < str.length; i++) {
            buf.setNumber(NumberFormat.UInt8BE, i, str.charCodeAt(i))
        }
        sendBuffer(buf)
    }

    /**
     * Send a number
     * @param num The number to send, eg: 42
     */
    //% block
    //% weight = 50
    export function sendNumber(num: number): void {
        const buf = pins.createBufferFromArray([num])
        sendBuffer(buf)
    }

    /**
     * Check if we're connected to the network
     * Returns true if the u-blox has successfully
     * attached to the network, or false if not.
     */
    //% block
    //% weight = 60
    export function isConnected(): boolean {
        return _isConnected
    }

    /**
     * Get signal strength in dBm
     */
    //% block
    //% advanced=true
    export function signalStrength(): number {
        writeCommand("AT+CSQ")
        let power = parseInt(readLine().substr(6))
        if (power == 99) {
            return 99
        }
        return -113 + power * 2
    }

    /**
     * Get the IMSI from the sim card on the EE-NBIOT-01
     */
    //% block
    //% advanced=true
    export function imsi(): string {
        writeCommand("AT+CIMI")
        return readLine()
    }

    /**
     * Get the IMEI from the u-blox N210
     */
    //% block
    //% advanced=true
    export function imei(): string {
        writeCommand("AT+CGSN=1")
        return readLine().substr(7, 15)
    }

    /**
     * Create a socket to send/receive data
     */
    //% block
    //% advanced=true
    export function createSocket() {
        writeCommand(`AT+NSOCR="DGRAM",17,30000,1`)
        socket = parseInt(readLine())
    }

    /**
     * Send raw AT-command to u-blox N210 and wait for OK
     * After 3 failed attempts it reboots the micro:bit
     * @param cmd The full command, eg: "AT+CFUN=1"
     * @param retries How many times to retry in case the command fails (default 3)
     * @param wait How long (in ms) to wait between a failed attempt and retrying (default 1000)
     * @param timeout How long to wait for a response (in ms) before timing out (default 30000)
     */
    //% block
    //% advanced=true
    export function writeCommand(cmd: string, retries = 3, wait = 1000, timeout = 30000): void {
        while (awaitingResponse) {
            basic.pause(100)
        }

        awaitingResponse = true

        while (retries-- > 0) {
            drain()

            serial.writeString(cmd + "\r")
            if (waitForResponse(timeout)) {
                // success
                awaitingResponse = false
                return
            }
            basic.pause(wait)
        }
        if (DEBUG) {
            basic.showString("ERR exec: " + cmd)
        }
        die()
    }

    /**
     * Check if we have unread response lines
     */
    //% block
    //% advanced=true
    export function availableLines(): number {
        return lines.length
    }

    /**
     * Read response line from u-blox N210
     */
    //% block
    //% advanced=true
    export function readLine(): string {
        if (availableLines() == 0) {
            return ""
        }
        return lines.shift()
    }

    /**
     * Reboot the u-blox N210
     */
    //% block
    //% advanced=true
    export function reboot(): boolean {
        serial.writeString("AT+NRB\r")
        basic.pause(2000)
        drain()
        return waitForResponse()
    }

    let rxData = ""
    function readSerialData(): void {
        // block read until we get a character
        let tmp = serial.readBuffer(1)
        let char = String.fromCharCode(tmp.getNumber(NumberFormat.UInt8LE, 0))
        rxData += char

        // check if we have a complete line
        let lineEnd = rxData.indexOf("\r\n")
        if (lineEnd == -1) {
            return
        }
        // ignore empty lines
        if (lineEnd > 0) {
            lines.push(rxData.substr(0, lineEnd))
        }
        rxData = rxData.substr(lineEnd + 2)
    }

    function sendBuffer(buf: Buffer): void {
        if (!_isConnected || buf.length == 0) {
            return
        } else if (socket == -1) {
            createSocket()
        }
        writeCommand(`AT+NSOST=${socket},"${serverIp}",${serverPort},${buf.length},"${buf.toHex()}"`)
    }

    function waitForResponse(timeout = 10000): boolean {
        const delayTime = 100
        let end = input.runningTime() + timeout

        while (input.runningTime() < end) {
            if (lines.length > 0) {
                let lastLine = lines[lines.length - 1]
                if (lastLine == "OK") {
                    return true
                } else if (lastLine.indexOf("ERROR") >= 0) {
                    if (DEBUG && lastLine.indexOf("+CME") == 0) {
                        let err = lastLine.substr(12)
                        basic.showString(`E${err}`)
                    }
                    return false
                }
            }
            basic.pause(delayTime)
        }
        return false
    }

    /**
     * Discard unread received serial data
     */
    export function drain(): void {
        rxData = ""
        while (lines.length > 0) {
            lines.pop()
        }
    }

    function checkConnection(): number {
        writeCommand("AT+CEREG?")
        let response = readLine()
        return parseInt(response.charAt(10))
    }

    function die(): boolean {
        basic.showIcon(IconNames.Skull)
        basic.pause(5000)
        control.reset()
        return false
    }
}
