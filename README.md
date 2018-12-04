# pxt-nbiot

A package to use a Narrowband IoT board with u-blox SARA N2xx with micro:bit. We made this package so the [board we've made](https://shop.exploratory.engineering/collections/nb-iot/products/assembled-ee-nbiot-01-v1-1-breakout-module) can be used with a micro:bit. That board only works with Telenor Norway, but it should be possible to use this with any board that has a u-blox SARA N2xx and exposes the RXD and TXD pins. NB-IoT is a technology using the mobile network to send small messages from [anywhere there is 4G coverage that has been upgraded for NB-IoT](https://www.gsma.com/iot/deployment-map/).

The micro:bit needs to be powered by a power source which can handle the u-blox SARA N210, which is minimum 3.1V. So the common 2xAA battery pack won't do (only 3.0V). USB should work fine because it's regulated to 3.3V on the micro:bit.

## Wiring

micro:bit | SARA N210
---------:|----------
P0 | RXD
P1 | TXD
3V (see note above) | VCC
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
- [ ] Use "pxt bump" to create a tagged release on GitHub
- [ ] Get your package reviewed and approved https://makecode.microbit.org/packages/approval

Read more at https://makecode.microbit.org/packages/build-your-own

## License

Apache 2.0

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)
