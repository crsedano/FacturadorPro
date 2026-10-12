<?php

namespace Tests\Unit\Rules;

use App\Rules\SubdomainNotLatin;
use PHPUnit\Framework\TestCase;

class SubdomainNotLatinTest extends TestCase
{
    private SubdomainNotLatin $rule;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rule = new SubdomainNotLatin();
    }

    public function test_valid_alphanumeric_subdomain_passes()
    {
        $this->assertTrue($this->rule->passes('subdomain', 'clienteabc'));
        $this->assertTrue($this->rule->passes('subdomain', 'cliente123'));
        $this->assertTrue($this->rule->passes('subdomain', 'ABC'));
    }

    public function test_subdomain_with_accents_fails()
    {
        $this->assertFalse($this->rule->passes('subdomain', 'clienté'));
        $this->assertFalse($this->rule->passes('subdomain', 'añolab'));
    }

    public function test_subdomain_with_symbols_fails()
    {
        $this->assertFalse($this->rule->passes('subdomain', 'cliente.test'));
        $this->assertFalse($this->rule->passes('subdomain', 'cliente-test'));
        $this->assertFalse($this->rule->passes('subdomain', 'cliente_test'));
    }

    public function test_clean_string_converts_accented_to_latin1_bytes()
    {
        $result = $this->rule->cleanString('áéíóú');
        $this->assertIsString($result);
        // UTF-8 multibyte (10 bytes) → ISO-8859-1 singlebyte (5 bytes)
        $this->assertSame(5, strlen($result));
    }

    public function test_clean_string_preserves_plain_ascii()
    {
        $result = $this->rule->cleanString('cliente');
        $this->assertSame('cliente', $result);
    }
}
