<?php

namespace Tests\Unit\CoreFacturalo;

use App\CoreFacturalo\Facturalo;
use Tests\TestCase;

/**
 * Guards SUNAT state type constants — if these change the CDR processing breaks.
 */
class FacturaloStateTypesTest extends TestCase
{
    public function test_registered_constant()
    {
        $this->assertSame('01', Facturalo::REGISTERED);
    }

    public function test_sent_constant()
    {
        $this->assertSame('03', Facturalo::SENT);
    }

    public function test_accepted_constant()
    {
        $this->assertSame('05', Facturalo::ACCEPTED);
    }

    public function test_observed_constant()
    {
        $this->assertSame('07', Facturalo::OBSERVED);
    }

    public function test_rejected_constant()
    {
        $this->assertSame('09', Facturalo::REJECTED);
    }

    public function test_voided_constant()
    {
        $this->assertSame('11', Facturalo::VOIDED);
    }

    public function test_canceling_constant()
    {
        $this->assertSame('13', Facturalo::CANCELING);
    }
}
