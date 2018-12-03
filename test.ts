nbiot.onConnected(function () {
    basic.showIcon(IconNames.Happy)
})

input.onButtonPressed(Button.A, function () {
    nbiot.sendNumberAsString(123)
})

input.onButtonPressed(Button.B, function () {
    nbiot.sendString("Hello")
})

basic.forever(function () {
    nbiot.sendNumberAsString(input.temperature())
    basic.pause(60000)
})

basic.showIcon(IconNames.Sad)
nbiot.enable()
