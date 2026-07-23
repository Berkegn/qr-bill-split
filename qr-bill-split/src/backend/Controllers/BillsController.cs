using Microsoft.AspNetCore.Mvc;
using QrBillSplit.Backend.Services;

namespace QrBillSplit.Backend.Controllers;

/// <summary>
/// Handles all bill-related financial operations including partial payments and splitting.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BillsController : ControllerBase
{
    private readonly IBillSplitService _billSplitService;
    private readonly IAdvancedSplitService _advancedSplitService;

    public BillsController(IBillSplitService billSplitService, IAdvancedSplitService advancedSplitService)
    {
        _billSplitService = billSplitService;
        _advancedSplitService = advancedSplitService;
    }

    /// <summary>
    /// Processes a partial payment for a specific item.
    /// </summary>
    [HttpPost("{tableId}/pay-partial")]
    public async Task<IActionResult> PayPartial(string tableId, [FromBody] PayPartialRequest request)
    {
        var success = await _billSplitService.PayPartialAsync(tableId, request.ItemId, request.Amount, request.UserId);
        return Ok(new { success = true });
    }

    /// <summary>
    /// Splits the remaining unpaid bill evenly among users.
    /// </summary>
    [HttpPost("{tableId}/split-remaining")]
    public async Task<IActionResult> SplitRemaining(string tableId, [FromBody] SplitRemainingRequest request)
    {
        var breakdown = await _billSplitService.SplitRemainingAsync(tableId, request.UserIds);
        return Ok(new { success = true, splitBreakdown = breakdown });
    }

    /// <summary>
    /// Splits a specific item proportionally among multiple users.
    /// </summary>
    [HttpPost("{tableId}/split-shared")]
    public async Task<IActionResult> SplitSharedItem(string tableId, [FromBody] SplitSharedRequest request)
    {
        var breakdown = await _advancedSplitService.SplitSharedItemAsync(tableId, request.ItemId, request.UserIds);
        return Ok(new { success = true, splitBreakdown = breakdown });
    }

    /// <summary>
    /// Applies a proportional tax and tip to the user's base shares.
    /// </summary>
    [HttpPost("{tableId}/apply-tax")]
    public IActionResult ApplyTaxAndTip(string tableId, [FromBody] ApplyTaxRequest request)
    {
        var finalTotals = _advancedSplitService.ApplyTaxAndTip(request.UserBaseShares, request.TaxPercent, request.TipPercent);
        return Ok(new { success = true, splitBreakdown = finalTotals });
    }

    /// <summary>
    /// Plays the bill roulette to randomly assign an unpaid item.
    /// </summary>
    [HttpPost("{tableId}/roulette")]
    public async Task<IActionResult> PlayRoulette(string tableId, [FromBody] RouletteRequest request)
    {
        var result = await _billSplitService.PlayRouletteAsync(tableId, request.ParticipantIds);
        return Ok(new { success = true, rouletteResult = result });
    }
}

public class PayPartialRequest
{
    public int ItemId { get; set; }
    public decimal Amount { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class SplitRemainingRequest
{
    public List<string> UserIds { get; set; } = new List<string>();
}

public class SplitSharedRequest
{
    public int ItemId { get; set; }
    public List<string> UserIds { get; set; } = new List<string>();
}

public class ApplyTaxRequest
{
    public Dictionary<string, decimal> UserBaseShares { get; set; } = new Dictionary<string, decimal>();
    public decimal TaxPercent { get; set; }
    public decimal TipPercent { get; set; }
}

public class RouletteRequest
{
    public List<string> ParticipantIds { get; set; } = new List<string>();
}
