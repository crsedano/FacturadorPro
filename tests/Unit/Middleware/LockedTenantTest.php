<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\LockedTenant;
use App\Models\Tenant\Configuration;
use Illuminate\Http\Request;
use Mockery;
use Tests\TestCase;

class LockedTenantTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_locked_tenant_returns_403_when_locked()
    {
        $config = Mockery::mock(Configuration::class);
        $config->shouldReceive('isLockedTenant')->once()->andReturn(true);

        $this->app->bind(Configuration::class, fn() => $config);

        Configuration::shouldReceive('first')->once()->andReturn($config);

        $middleware = new LockedTenant();
        $request    = Request::create('/documents', 'GET');

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        $middleware->handle($request, fn() => response('ok'));
    }

    public function test_unlocked_tenant_passes_through()
    {
        $config = Mockery::mock(Configuration::class);
        $config->shouldReceive('isLockedTenant')->once()->andReturn(false);

        Configuration::shouldReceive('first')->once()->andReturn($config);

        $middleware = new LockedTenant();
        $request    = Request::create('/documents', 'GET');
        $passed     = false;

        $middleware->handle($request, function () use (&$passed) {
            $passed = true;
            return response('ok');
        });

        $this->assertTrue($passed);
    }

    public function test_null_configuration_creates_default_and_passes_through()
    {
        Configuration::shouldReceive('first')->once()->andReturn(null);

        $middleware = new LockedTenant();
        $request    = Request::create('/documents', 'GET');
        $passed     = false;

        $middleware->handle($request, function () use (&$passed) {
            $passed = true;
            return response('ok');
        });

        $this->assertTrue($passed);
    }
}
