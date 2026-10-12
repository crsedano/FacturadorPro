<?php

namespace Tests\Unit\CoreFacturalo;

use App\CoreFacturalo\Services\Models\Person;
use PHPUnit\Framework\TestCase;

/**
 * Guards Person DTO properties used by Reniec/DNI services.
 * Dynamic property assignment breaks in PHP 8.2 without declared props.
 */
class PersonModelTest extends TestCase
{
    public function test_reniec_properties_are_declared()
    {
        $person = new Person();

        $person->dni             = '12345678';
        $person->codVerifica     = 'A1';
        $person->nombres         = 'JUAN';
        $person->apellidoPaterno = 'PEREZ';
        $person->apellidoMaterno = 'GARCIA';

        $this->assertSame('12345678', $person->dni);
        $this->assertSame('A1', $person->codVerifica);
        $this->assertSame('JUAN', $person->nombres);
        $this->assertSame('PEREZ', $person->apellidoPaterno);
        $this->assertSame('GARCIA', $person->apellidoMaterno);
    }

    public function test_standard_properties_are_declared()
    {
        $person = new Person();

        $person->number           = '12345678';
        $person->name             = 'JUAN PEREZ';
        $person->names            = 'JUAN';
        $person->first_name       = 'JUAN';
        $person->last_name        = 'PEREZ';
        $person->verification_code = 'X';
        $person->date_of_birthday = '1990-01-01';
        $person->sex              = 'M';
        $person->voting_group     = '1';

        $this->assertSame('12345678', $person->number);
    }
}
