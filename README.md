# pxt-nbiot

A package to use a Narrowband IoT board with u-blox SARA N2xx with micro:bit. [Like the one we've made for Telenor Norway](https://shop.exploratory.engineering/collections/nb-iot/products/assembled-ee-nbiot-01-v1-1-breakout-module). With NB-IoT you can send short messages from [anywhere there is 4G coverage that has been upgraded for NB-IoT](https://www.gsma.com/iot/deployment-map/).

The micro:bit needs to be powered by a power source which can handle the u-blox SARA N210, which is minimum 3.1V. So the common 2xAA battery pack won't do (only 3.0V). USB should work fine.

## Wiring

micro:bit | SARA N210
---------:|----------
P0 | RXD
P1 | TXD
3V | VCC
GND | GND

## Basic usage

```blocks
// connect to the NB-IoT module on chosen pins (default P0 and P1)
nbiot.connect(SerialPin.P0, SerialPin.P1)

// configure what server to send to
nbiot.setServer("172.16.15.14", 1234)

// run the code when we're successfully connected to the network
nbiot.onConnected(function () {
    basic.showString("Connected")
})

// send number 123
input.onButtonPressed(Button.A, function () {
    nbiot.sendNumber(123)
})

input.onButtonPressed(Button.B, function () {
    nbiot.sendString("Hello")
})
```

## TODO

- [ ] Add a reference for your blocks here
- [ ] Add "icon.png" image (300x200) in the root folder
- [ ] Add "- beta" to the GitHub project description if you are still iterating it.
- [ ] Turn on your automated build on https://travis-ci.org
- [ ] Use "pxt bump" to create a tagged release on GitHub
- [ ] Get your package reviewed and approved https://makecode.microbit.org/packages/approval

Read more at https://makecode.microbit.org/packages/build-your-own

## License

Apache 2.0

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)
