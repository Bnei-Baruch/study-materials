package common

import "log"

// PanicIfNotNil panics if error is not nil
func PanicIfNotNil(err error) {
	if err != nil {
		log.Panic(err)
	}
}


